-- Run once in the new dedicated Supabase project's SQL editor.
create table public.mb_profiles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 name text not null check (length(trim(name)) between 1 and 32),
 color smallint not null default 0 check (color between 0 and 5),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.mb_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 profile_id uuid not null,
 name text not null check (length(trim(name)) between 1 and 80),
 file_name text not null,
 dataset_path text not null check (dataset_path=user_id::text||'/'||id::text||'/dataset.json'),
 bar_count integer not null check (bar_count>=20),
 state jsonb not null check (state ? 'version' and state->>'version'='1'),
 summary jsonb not null default '{}'::jsonb,
 revision bigint not null default 1 check (revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(profile_id,user_id) references public.mb_profiles(id,user_id) on delete cascade
);
create index mb_profiles_owner on public.mb_profiles(user_id);
create index mb_sessions_owner_profile on public.mb_sessions(user_id,profile_id,updated_at desc);
alter table public.mb_profiles enable row level security;
alter table public.mb_sessions enable row level security;
revoke all on public.mb_profiles,public.mb_sessions from anon,authenticated;
grant select,insert,delete on public.mb_profiles,public.mb_sessions to authenticated;
grant update(name,color) on public.mb_profiles to authenticated;
grant update(name,state,summary,revision) on public.mb_sessions to authenticated;
create policy mb_profiles_select on public.mb_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy mb_profiles_insert on public.mb_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy mb_profiles_update on public.mb_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy mb_profiles_delete on public.mb_profiles for delete to authenticated using(user_id=(select auth.uid()));
create policy mb_sessions_select on public.mb_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy mb_sessions_insert on public.mb_sessions for insert to authenticated with check(user_id=(select auth.uid()));
create policy mb_sessions_update on public.mb_sessions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy mb_sessions_delete on public.mb_sessions for delete to authenticated using(user_id=(select auth.uid()));
create function public.mb_session_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.revision <> old.revision+1 then raise exception 'Session revision must advance by one'; end if;
 new.updated_at=now();
 return new;
end;
$$;
create trigger mb_session_revision before update on public.mb_sessions for each row execute function public.mb_session_revision();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mb-datasets','mb-datasets',false,52428800,array['application/json']);
create policy mb_dataset_select on storage.objects for select to authenticated using(bucket_id='mb-datasets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy mb_dataset_insert on storage.objects for insert to authenticated with check(bucket_id='mb-datasets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy mb_dataset_delete on storage.objects for delete to authenticated using(bucket_id='mb-datasets' and (storage.foldername(name))[1]=(select auth.uid())::text);
