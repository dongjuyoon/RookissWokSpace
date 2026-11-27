-- 현재 전체 스키마 (참고용 기록입니다. 실제 적용은 Supabase 마이그레이션으로 이미 끝났습니다.)

-- 프로필: 계정과 같은 id. 이름 · 직책 · 부서 · 승인 상태 · 권한을 담습니다.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null,
  title text not null default '',
  department text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- 초대 코드: 관리자가 발급하고, 한 번 쓰면 used_by 가 채워집니다. 회수는 revoked_at 으로 기록합니다.
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  memo text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  revoked_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;

-- 승인된 관리자인지 확인
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'approved'
  );
$$;

-- 가입 전 초대 코드 확인 (사용 전이고 회수되지 않은 코드만 true)
create or replace function public.check_invite_code(p_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invite_codes c
    where c.code = p_code and c.used_by is null and c.revoked_at is null
  );
$$;
revoke execute on function public.check_invite_code(text) from public;
grant execute on function public.check_invite_code(text) to anon, authenticated;

-- 가입 시 프로필을 만들고 초대 코드를 소모합니다. 코드가 맞지 않으면 가입 전체가 실패합니다.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_user_meta_data->>'invite_code' is null then
    return new;
  end if;

  insert into public.profiles (id, email, name, title, department, status)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'title', ''),
    coalesce(new.raw_user_meta_data->>'department', ''),
    'pending'
  );

  update public.invite_codes
     set used_by = new.id, used_at = now()
   where code = new.raw_user_meta_data->>'invite_code'
     and used_by is null and revoked_at is null;

  if not found then
    raise exception 'invalid invite code';
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS 정책
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_select_admin" on public.profiles for select to authenticated
  using (public.is_admin());
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "invite_codes_select_admin" on public.invite_codes for select to authenticated
  using (public.is_admin());
create policy "invite_codes_insert_admin" on public.invite_codes for insert to authenticated
  with check (public.is_admin() and created_by = (select auth.uid()));
create policy "invite_codes_revoke_admin" on public.invite_codes for update to authenticated
  using (public.is_admin() and used_by is null) with check (public.is_admin());

-- 첫 초대 코드
insert into public.invite_codes (code, memo) values ('RKS-2026', '첫 관리자용');
