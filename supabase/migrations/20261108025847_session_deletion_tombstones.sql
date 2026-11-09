-- Matches the migration version recorded by the connected cloud project.
alter table public.mb_sessions add column if not exists deleted_at timestamptz;
grant update(deleted_at) on public.mb_sessions to authenticated;

-- A tombstone prevents older devices from writing to a session being removed.
create or replace function public.mb_session_revision() returns trigger
language plpgsql set search_path='' as $$
begin
 if old.deleted_at is not null then raise exception 'Session has been deleted'; end if;
 if new.revision <> old.revision+1 then raise exception 'Session revision must advance by one'; end if;
 new.updated_at=now();
 return new;
end;
$$;
