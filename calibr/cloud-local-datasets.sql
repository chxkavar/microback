-- Browser-only candle bodies; retain all existing ownership and revision checks.
create or replace function calibr_private.commit(p_changes jsonb) returns jsonb language plpgsql security definer
set search_path='' as $$
declare u uuid:=auth.uid(); item jsonb; d jsonb; old public.calibr_records; parent public.calibr_records;
 asset jsonb; k text; rid text; pid text; aid text; expected bigint; answer jsonb:='[]';
begin
 if u is null then raise exception 'Sign in to continue.'; end if;
 if jsonb_array_length(coalesce(p_changes->'writes','[]'))>500 then raise exception 'Too many changes.'; end if;
 if jsonb_array_length(coalesce(p_changes->'removes','[]'))>0 then raise exception 'Permanent deletion is disabled. Use Recently deleted.'; end if;
 for asset in select value from jsonb_array_elements(coalesce(p_changes->'assets','[]')) loop
  if asset->>'id' is null or length(asset->>'id') not between 1 and 200 then raise exception 'Invalid asset owner.'; end if;
  if exists(select 1 from public.calibr_assets where id=asset->>'id') then
   raise exception 'Candle assets are immutable. Create a new asset.';
  end if;
  if exists(select 1 from (select value as b,lag((value->>'t')::numeric) over(order by ordinality) previous from jsonb_array_elements(asset->'bars') with ordinality) x where
    not(jsonb_strip_nulls(b) ?& array['t','o','h','l','c','v']) or
    exists(select 1 from jsonb_each(b) f where f.key in ('t','o','h','l','c','v') and jsonb_typeof(f.value)<>'number') or
    (b->>'t')::numeric<=previous or least((b->>'o')::numeric,(b->>'h')::numeric,(b->>'l')::numeric,(b->>'c')::numeric)<=0 or
    (b->>'h')::numeric<greatest((b->>'o')::numeric,(b->>'c')::numeric) or (b->>'l')::numeric>least((b->>'o')::numeric,(b->>'c')::numeric) or (b->>'v')::numeric<0) then raise exception 'Invalid or unordered candle data.'; end if;
  insert into public.calibr_assets(id,owner_id,bars) values(asset->>'id',u,asset->'bars');
 end loop;
 for item in select value from jsonb_array_elements(coalesce(p_changes->'writes','[]')) loop
  d:=(item->'data')-'_etag'-'bars'; rid:=d->>'id'; k:=d->>'type'; pid:=d->>'profileId'; aid:=d->>'assetId';
  expected:=coalesce((item->>'expected')::bigint,0);
  if rid is null or k is null or k<>'dataset' and aid is not null then raise exception 'Invalid record or asset reference.'; end if;
  select * into old from public.calibr_records where id=rid for update;
  if found then
   if old.owner_id is distinct from u or old.visibility<>'private' then raise exception 'This record is not owned by your account.'; end if;
   if old.version<>expected or old.kind<>k then raise exception 'REVISION_CONFLICT: This record changed elsewhere. Reopen it.'; end if;
   if old.profile_id is distinct from pid or old.asset_id is distinct from aid then raise exception 'Ownership and candle data cannot be reassigned.'; end if;
  elsif expected<>0 then raise exception 'REVISION_CONFLICT: Record no longer exists.';
  end if;
  if k not in ('profile','session','dataset','dataset-folder') then raise exception 'Use the publication review endpoints.'; end if;
  if k='profile' then
   if pid is not null or nullif(trim(d->>'name'),'') is null or d->>'accountId' is null or d->>'accountId'<>'cloud-account:'||u::text or length(trim(d->>'name')) not between 1 and 32 then raise exception 'Invalid profile.'; end if;
  else
   select * into parent from public.calibr_records where id=pid and kind='profile' and owner_id=u;
   if not found then raise exception 'Choose a profile owned by your account.'; end if;
  end if;
  if k='dataset-folder' then
   if not(jsonb_strip_nulls(d) ?& array['scope','name','category']) or d->>'scope'<>'private' or length(trim(d->>'name')) not between 1 and 50 or
    d->>'category' not in ('Futures','Crypto','Forex','Stocks','Other') then raise exception 'Invalid private folder.'; end if;
  elsif k='dataset' then
   if not(d ?& array['visibility','settings','barCount','name']) or d->>'visibility' not in ('private','session-only') then raise exception 'Public datasets require administrator approval.'; end if;
   if d->>'sourceStorage'='browser' then
    if aid is not null or d->>'visibility' is distinct from 'session-only' or coalesce(d->>'fingerprint','')!~'^[0-9a-f]{64}$' or coalesce((d->>'barCount')::bigint,0)<20 or coalesce((d->>'first')::numeric,0)<=0 or coalesce((d->>'last')::numeric,0)<(d->>'first')::numeric then raise exception 'Invalid browser dataset identity.'; end if;
   elsif not exists(select 1 from public.calibr_assets where id=aid and owner_id=u) then raise exception 'Dataset asset is not owned by your account.'; end if;
   if old.id is not null and (d->'sourceStorage' is distinct from old.data->'sourceStorage' or d->'fingerprint' is distinct from old.data->'fingerprint') then raise exception 'Dataset identity cannot be changed.'; end if;
   if not(jsonb_strip_nulls(d->'settings') ?& array['tickSize','pointValue','quantityStep','currency','sourceTimezone']) or (d#>>'{settings,tickSize}')::numeric<=0 or (d#>>'{settings,pointValue}')::numeric<=0 or
      (d#>>'{settings,quantityStep}')::numeric<=0 or d#>>'{settings,currency}' not in ('USD','INR','EUR','GBP') then raise exception 'Invalid dataset calculation settings.'; end if;
   if old.id is not null and (d->'settings' is distinct from old.data->'settings' or d->'barCount' is distinct from old.data->'barCount') then raise exception 'Saved dataset settings are immutable.'; end if;
   if d->>'visibility'='private' and not exists(select 1 from public.calibr_records f where f.id=d->>'folderId' and f.kind='dataset-folder' and f.owner_id=u and f.profile_id=pid) then raise exception 'Choose one of this profile''s folders.'; end if;
  elsif k='session' then
   if not(d ?& array['name','initialBalance','status','datasetId','datasetSettings','revision']) or length(trim(d->>'name')) not between 1 and 80 or (d->>'initialBalance')::numeric<=0 or d->>'status' not in ('active','completed') then raise exception 'Invalid practice session.'; end if;
   if not exists(select 1 from public.calibr_records ds where ds.id=d->>'datasetId' and ds.kind='dataset' and
     (ds.visibility='public' or ds.owner_id=u and ds.profile_id=pid)) then raise exception 'Dataset is not available to this profile.'; end if;
   if old.id is not null then
    if d->'initialBalance' is distinct from old.data->'initialBalance' or d->'datasetId' is distinct from old.data->'datasetId' or d->'datasetSettings' is distinct from old.data->'datasetSettings' then raise exception 'Starting capital and dataset cannot be changed.'; end if;
    if (d->>'revision')::bigint<>coalesce((old.data->>'revision')::bigint,0)+1 then raise exception 'Session revision must advance by one.'; end if;
    if old.data->>'status'='completed' and (d-'status'-'completedAt'-'revision'-'updatedAt'-'deletedAt') is distinct from
       (old.data-'status'-'completedAt'-'revision'-'updatedAt'-'deletedAt') then raise exception 'Completed sessions are read-only. Mark Active first.'; end if;
    if old.data->>'deletedAt' is not null and (d-'revision'-'updatedAt'-'deletedAt') is distinct from
       (old.data-'revision'-'updatedAt'-'deletedAt') then raise exception 'Restore the deleted session first.'; end if;
   end if;
   if d->>'status'='completed' and (d#>'{state,position}' is distinct from 'null'::jsonb and d#>'{state,position}' is not null or
      coalesce(jsonb_array_length(d#>'{state,orders}'),0)>0) then raise exception 'Close positions and cancel pending orders before completing.'; end if;
  end if;
  d:=d||jsonb_build_object('updatedAt',clock_timestamp());
  if old.id is null then
   insert into public.calibr_records(id,owner_id,kind,profile_id,asset_id,data) values(rid,u,k,pid,aid,d);
  else update public.calibr_records set data=d,version=version+1,updated_at=now() where id=rid; end if;
  answer:=answer||jsonb_build_array(jsonb_build_object('id',rid,'version',(select version from public.calibr_records where id=rid),'updatedAt',d->'updatedAt'));
 end loop;
 return answer;
end $$;
