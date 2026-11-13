-- Calibr is additive: no changes to mb_profiles, mb_sessions, or mb-datasets.
-- Immutable candle assets are stored once; list queries never return candle bodies.
create schema if not exists calibr_private;
revoke all on schema calibr_private from public, anon;
grant usage on schema calibr_private to authenticated;

create table public.calibr_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.calibr_admins enable row level security;
revoke all on public.calibr_admins from public, anon, authenticated;

create table public.calibr_assets (
 id text primary key, owner_id uuid not null references auth.users(id),
 bars jsonb not null check(jsonb_typeof(bars)='array' and jsonb_array_length(bars)>=20),
 created_at timestamptz not null default now(),
 check(octet_length(bars::text)<=26214400)
);
create index calibr_assets_owner on public.calibr_assets(owner_id);
alter table public.calibr_assets enable row level security;

create table public.calibr_records (
 id text primary key check(length(id) between 1 and 200),
 owner_id uuid references auth.users(id),
 kind text not null check(kind in ('profile','session','dataset','dataset-folder','dataset-request')),
 profile_id text, visibility text not null default 'private' check(visibility in ('private','public')),
 asset_id text references public.calibr_assets(id),
 version bigint not null default 1 check(version>0),
 data jsonb not null check(jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 check(data ?& array['id','type'] and data->>'id'=id and data->>'type'=kind),
 check((visibility='private' and owner_id is not null) or
       (visibility='public' and owner_id is null and kind in ('dataset','dataset-folder')))
);
create index calibr_records_owner_kind on public.calibr_records(owner_id,kind);
create index calibr_records_profile on public.calibr_records(profile_id);
create index calibr_records_asset on public.calibr_records(asset_id) where asset_id is not null;
create index calibr_records_public on public.calibr_records(kind) where visibility='public';
create unique index calibr_folder_names on public.calibr_records(
 coalesce(owner_id::text,''),coalesce(profile_id,''),visibility,
 lower(data->>'category'),lower(data->>'name')) where kind='dataset-folder';
create unique index calibr_one_publication on public.calibr_records(owner_id,(data->>'datasetId'))
 where kind='dataset-request' and data->>'status' in ('pending','approved');
alter table public.calibr_records enable row level security;
revoke all on public.calibr_records,public.calibr_assets from public,anon,authenticated;
grant select(id,kind,profile_id,visibility,asset_id,version,data,updated_at) on public.calibr_records to authenticated;
grant select(id,bars) on public.calibr_assets to authenticated;

-- A fixed server-owned membership table, never user-editable JWT/user metadata.
create function calibr_private.is_admin() returns boolean language sql stable security definer
set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.calibr_admins a
 join auth.users u on u.id=a.user_id where a.user_id=auth.uid() and u.email_confirmed_at is not null)
$$;
revoke all on function calibr_private.is_admin() from public,anon;
grant execute on function calibr_private.is_admin() to authenticated;

create policy calibr_record_read on public.calibr_records for select to authenticated
using(owner_id=(select auth.uid()) or visibility='public' or
 (kind='dataset-request' and (select calibr_private.is_admin())));

-- Definer lookup avoids circular RLS between assets and their referencing documents.
create function calibr_private.asset_visible(p_id text) returns boolean language sql stable security definer
set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.calibr_assets a where a.id=p_id and
 (a.owner_id=auth.uid() or exists(select 1 from public.calibr_records r where r.asset_id=a.id and
 (r.visibility='public' or r.owner_id=auth.uid() or (r.kind='dataset-request' and calibr_private.is_admin())))))
$$;
revoke all on function calibr_private.asset_visible(text) from public,anon;
grant execute on function calibr_private.asset_visible(text) to authenticated;
create policy calibr_asset_read on public.calibr_assets for select to authenticated
using((select calibr_private.asset_visible(id)));

create function public.calibr_role() returns boolean language sql stable security invoker
set search_path='' as $$select calibr_private.is_admin()$$;
revoke all on function public.calibr_role() from public,anon;
grant execute on function public.calibr_role() to authenticated;

-- The only generic write path. Every row is checked inside the same transaction.
-- SD is necessary for atomic multi-record validation; no direct client write grants exist.
create function calibr_private.commit(p_changes jsonb) returns jsonb language plpgsql security definer
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
   if not exists(select 1 from public.calibr_assets where id=aid and owner_id=u) then raise exception 'Dataset asset is not owned by your account.'; end if;
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
revoke all on function calibr_private.commit(jsonb) from public,anon;
grant execute on function calibr_private.commit(jsonb) to authenticated;
create function public.calibr_commit(p_changes jsonb) returns jsonb language sql security invoker
set search_path='' as $$select calibr_private.commit(p_changes)$$;
revoke all on function public.calibr_commit(jsonb) from public,anon;
grant execute on function public.calibr_commit(jsonb) to authenticated;

create function calibr_private.request_publication(p_dataset text,p_options jsonb) returns jsonb language plpgsql security definer
set search_path='' as $$
declare u uuid:=auth.uid(); ds public.calibr_records; pr public.calibr_records; rid text; d jsonb; snap jsonb;
begin
 if u is null then raise exception 'Sign in to continue.'; end if;
 select * into ds from public.calibr_records where id=p_dataset and kind='dataset' and owner_id=u and data->>'visibility'='private' for update;
 if not found then raise exception 'Save this dataset privately before requesting publication.'; end if;
 select * into pr from public.calibr_records where id=ds.profile_id and owner_id=u;
 if exists(select 1 from public.calibr_records where kind='dataset-request' and owner_id=u and data->>'datasetId'=p_dataset and data->>'status' in ('pending','approved')) then raise exception 'A pending or approved request already exists.'; end if;
 rid:='request-'||gen_random_uuid()::text;
 -- Whitelist the snapshot: never copy profile IDs, account email, sessions or trades into a public dataset.
 snap:=jsonb_build_object('name',coalesce(nullif(trim(p_options->>'name'),''),ds.data->>'name'),
  'fileName',ds.data->>'fileName','settings',ds.data->'settings','barCount',ds.data->'barCount',
  'first',ds.data->'first','last',ds.data->'last','rawRows',ds.data->'rawRows','invalid',ds.data->'invalid',
  'duplicates',ds.data->'duplicates','size',ds.data->'size','fingerprint',ds.data->'fingerprint','assetId',ds.asset_id);
 d:=jsonb_build_object('id',rid,'type','dataset-request','profileId',ds.profile_id,'accountId','cloud-account:'||u::text,
  'datasetId',ds.id,'requesterName',pr.data->>'name','requesterEmail',(select email from auth.users where id=u),
  'status','pending','name',snap->>'name','folder',coalesce(p_options->>'folder',ds.data->>'folder','MNQ'),
  'category',coalesce(p_options->>'category',ds.data->>'category','Futures'),'message',coalesce(p_options->>'message',''),
  'snapshot',snap,'assetId',ds.asset_id,'createdAt',now(),'decidedAt',null,'decisionNote','');
 if length(d->>'name') not between 1 and 80 or length(d->>'message')>1000 or length(d->>'folder') not between 1 and 50 or
   d->>'category' not in ('Futures','Crypto','Forex','Stocks','Other') then raise exception 'Invalid publication request.'; end if;
 insert into public.calibr_records(id,owner_id,kind,profile_id,asset_id,data) values(rid,u,'dataset-request',ds.profile_id,ds.asset_id,d);
 return d;
end $$;
revoke all on function calibr_private.request_publication(text,jsonb) from public,anon;
grant execute on function calibr_private.request_publication(text,jsonb) to authenticated;
create function public.calibr_request_publication(p_dataset text,p_options jsonb) returns jsonb language sql security invoker
set search_path='' as $$select calibr_private.request_publication(p_dataset,p_options)$$;
revoke all on function public.calibr_request_publication(text,jsonb) from public,anon;
grant execute on function public.calibr_request_publication(text,jsonb) to authenticated;

create function calibr_private.decide(p_request text,p_decision text,p_options jsonb) returns jsonb language plpgsql security definer
set search_path='' as $$
declare r public.calibr_records; f public.calibr_records; d jsonb; pub jsonb; fid text; did text; folder text; category text; note text;
begin
 if auth.uid() is null or not calibr_private.is_admin() then raise exception 'Only an administrator can review requests.'; end if;
 if p_decision not in ('approved','denied') then raise exception 'Choose approve or deny.'; end if;
 select * into r from public.calibr_records where id=p_request and kind='dataset-request' for update;
 if not found or r.data->>'status'<>'pending' then raise exception 'This request is unavailable or already reviewed.'; end if;
 note:=trim(coalesce(p_options->>'note',''));
 if length(note)>1000 or p_decision='denied' and note='' then raise exception 'Provide a denial reason under 1,000 characters.'; end if;
 if p_decision='approved' then
  folder:=coalesce(p_options->>'folder',r.data->>'folder');category:=coalesce(p_options->>'category',r.data->>'category');
  if length(trim(folder)) not between 1 and 50 or category not in ('Futures','Crypto','Forex','Stocks','Other') then raise exception 'Invalid public folder.'; end if;
  -- Serialize category/folder creation across concurrent approvals.
  perform pg_advisory_xact_lock(hashtext(lower(category||'/'||folder)));
  select * into f from public.calibr_records where kind='dataset-folder' and visibility='public' and
   lower(data->>'name')=lower(folder) and data->>'category'=category;
  fid:=f.id;
  if fid is null then
   fid:='public-folder-'||gen_random_uuid()::text;
   insert into public.calibr_records(id,owner_id,kind,visibility,data) values(fid,null,'dataset-folder','public',
    jsonb_build_object('id',fid,'type','dataset-folder','profileId',null,'scope','public','name',folder,'category',category,'createdAt',now()));
  end if;
  did:='public-'||r.id;
  pub:=(r.data->'snapshot')||jsonb_build_object('id',did,'type','dataset','visibility','public','profileId',null,
   'folderId',fid,'folder',folder,'category',category,'publishedAt',now(),'sourceRequestId',r.id);
  insert into public.calibr_records(id,owner_id,kind,visibility,asset_id,data) values(did,null,'dataset','public',r.asset_id,pub);
 end if;
 d:=r.data||jsonb_build_object('status',p_decision,'decisionNote',note,'decidedAt',now(),
  'reviewedBy','chandradevp60@gmail.com','publicDatasetId',did);
 update public.calibr_records set data=d,version=version+1,updated_at=now() where id=r.id;
 return d;
end $$;
revoke all on function calibr_private.decide(text,text,jsonb) from public,anon;
grant execute on function calibr_private.decide(text,text,jsonb) to authenticated;
create function public.calibr_decide(p_request text,p_decision text,p_options jsonb) returns jsonb language sql security invoker
set search_path='' as $$select calibr_private.decide(p_request,p_decision,p_options)$$;
revoke all on function public.calibr_decide(text,text,jsonb) from public,anon;
grant execute on function public.calibr_decide(text,text,jsonb) to authenticated;
