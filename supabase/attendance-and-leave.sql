-- =====================================================================
-- 근태 · 휴가 테이블과 권한 (Supabase 에 이미 적용했습니다. migration: attendance_and_leave)
-- =====================================================================

-- 근태: 하루에 한 줄. 출근은 insert, 퇴근은 같은 날 줄의 check_out 을 채웁니다.
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  unique (user_id, work_date),
  check (check_out is null or check_out >= check_in)
);

-- 휴가 신청. 신청하면 pending(대기), 관리자가 approved(승인) 또는 rejected(반려)로 바꿉니다.
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('연차')),
  start_date date not null,
  end_date date not null,
  days int generated always as ((end_date - start_date) + 1) stored,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;

-- 근태: 본인 것만 읽고 쓴다
create policy "attendance_select_own" on public.attendance for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "attendance_insert_own" on public.attendance for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_approved());
create policy "attendance_update_own" on public.attendance for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 휴가: 구성원은 본인 신청만 보고 대기 상태로만 넣는다. 관리자는 전사를 보고 대기 건을 결재한다.
create policy "leave_select_own" on public.leave_requests for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "leave_select_admin" on public.leave_requests for select to authenticated
  using (public.is_admin());
create policy "leave_insert_own" on public.leave_requests for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and public.is_approved());
create policy "leave_decide_admin" on public.leave_requests for update to authenticated
  using (public.is_admin() and status = 'pending')
  with check (public.is_admin());
