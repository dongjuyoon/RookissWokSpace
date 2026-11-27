-- =====================================================================
-- 사번: 승인이 완료된 순서대로 01, 02, 03 … 을 붙입니다.
-- 이미 Supabase 에 적용했습니다 (migration: assign_employee_no_on_approval).
-- 승인 전에는 사번이 없고, 승인되는 순간에 한 번만 붙습니다.
-- =====================================================================

create sequence if not exists public.employee_no_seq;

-- 승인 완료(pending/rejected → approved) 순간에 사번을 한 번만 붙입니다. 이미 사번이 있으면 건드리지 않습니다.
create or replace function public.assign_employee_no()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved'
     and new.employee_no is null
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.employee_no := lpad(nextval('public.employee_no_seq')::text, 2, '0');
  end if;
  return new;
end;
$$;
revoke execute on function public.assign_employee_no() from public, anon, authenticated;

drop trigger if exists on_profile_approved on public.profiles;
create trigger on_profile_approved
  before insert or update of status on public.profiles
  for each row execute function public.assign_employee_no();
