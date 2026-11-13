-- Membership is intentionally invisible even if read grants are added later.
create policy calibr_admins_no_direct_read on public.calibr_admins for select to authenticated using(false);

-- Public-folder metadata is an administrator operation, separate from private writes.
create function calibr_private.public_folder(p_id text,p_name text,p_category text) returns jsonb language plpgsql security definer
set search_path='' as $$
declare f public.calibr_records; rid text; d jsonb; label text:=trim(p_name);
begin
 if auth.uid() is null or not calibr_private.is_admin() then raise exception 'Only an administrator can manage public folders.'; end if;
 if label is null or length(label) not between 1 and 50 or p_category is null or p_category not in ('Futures','Crypto','Forex','Stocks','Other') then raise exception 'Invalid folder name or category.'; end if;
 perform pg_advisory_xact_lock(hashtext(lower(p_category||'/'||label)));
 if p_id is not null then
  select * into f from public.calibr_records where id=p_id and kind='dataset-folder' and visibility='public' for update;
  if not found then raise exception 'Public folder not found.'; end if;
 end if;
 if exists(select 1 from public.calibr_records where kind='dataset-folder' and visibility='public' and id is distinct from p_id and lower(data->>'name')=lower(label) and data->>'category'=p_category) then raise exception 'A folder with that name already exists.'; end if;
 rid:=coalesce(p_id,'public-folder-'||gen_random_uuid()::text);
 d:=coalesce(f.data,jsonb_build_object('id',rid,'type','dataset-folder','profileId',null,'scope','public','createdAt',now()))||jsonb_build_object('name',label,'category',p_category);
 if p_id is null then insert into public.calibr_records(id,kind,visibility,data) values(rid,'dataset-folder','public',d);
 else
  update public.calibr_records set data=d,version=version+1,updated_at=now() where id=rid;
  update public.calibr_records set data=data||jsonb_build_object('folder',label,'category',p_category),version=version+1,updated_at=now()
   where kind='dataset' and visibility='public' and data->>'folderId'=rid;
 end if;
 return d;
end $$;
revoke all on function calibr_private.public_folder(text,text,text) from public,anon;
grant execute on function calibr_private.public_folder(text,text,text) to authenticated;
create function public.calibr_public_folder(p_id text,p_name text,p_category text) returns jsonb language sql security invoker
set search_path='' as $$select calibr_private.public_folder(p_id,p_name,p_category)$$;
revoke all on function public.calibr_public_folder(text,text,text) from public,anon;
grant execute on function public.calibr_public_folder(text,text,text) to authenticated;
