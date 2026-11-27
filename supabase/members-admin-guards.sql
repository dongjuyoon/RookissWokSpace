-- =====================================================================
-- 구성원 관리 보호 장치 (Supabase 에 이미 적용했습니다. migration: members_admin_guards)
-- =====================================================================

-- 사번은 한 사람에게만 (비어 있는 사번은 여러 명이 가져도 됩니다)
create unique index if not exists profiles_employee_no_key
  on public.profiles (employee_no) where employee_no is not null;

-- 승인된 관리자가 마지막 한 명이면 권한이나 승인 상태를 내릴 수 없습니다.
create or replace function public.keep_one_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'admin' and old.status = 'approved'
     and (new.role <> 'admin' or new.status <> 'approved') then
    if not exists (
      select 1 from public.profiles p
      where p.role = 'admin' and p.status = 'approved' and p.id <> old.id
    ) then
      raise exception 'last admin cannot be removed';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.keep_one_admin() from public, anon, authenticated;

drop trigger if exists keep_one_admin on public.profiles;
create trigger keep_one_admin
  before update of role, status on public.profiles
  for each row execute function public.keep_one_admin();
