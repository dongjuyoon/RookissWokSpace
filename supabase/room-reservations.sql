-- =====================================================================
-- 회의실 예약 (Supabase 에 이미 적용했습니다. migration: room_reservations)
-- 방은 01 ~ 09 입니다. 같은 방·같은 날짜에 시간이 겹치면 트리거가 저장을 막습니다.
-- =====================================================================

create table public.room_reservations (
  id uuid primary key default gen_random_uuid(),
  room_no text not null check (room_no in ('01','02','03','04','05','06','07','08','09')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- 같은 방, 같은 날에 시간이 겹치면 저장하지 않습니다 (수정할 때도 같은 규칙)
create or replace function public.prevent_room_overlap()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.room_reservations r
    where r.room_no = new.room_no
      and r.reservation_date = new.reservation_date
      and r.id <> new.id
      and r.start_time < new.end_time
      and r.end_time > new.start_time
  ) then
    raise exception 'room overlap';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.prevent_room_overlap() from public, anon, authenticated;

create trigger room_reservations_no_overlap
  before insert or update on public.room_reservations
  for each row execute function public.prevent_room_overlap();

alter table public.room_reservations enable row level security;

-- 승인된 구성원은 모든 방의 예약을 본다 (시간표를 보려면 필요)
create policy "rooms_select_approved" on public.room_reservations for select to authenticated
  using (public.is_approved());
-- 예약은 본인 이름으로만
create policy "rooms_insert_own" on public.room_reservations for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_approved());
-- 수정은 예약자 본인 또는 관리자
create policy "rooms_update_owner_or_admin" on public.room_reservations for update to authenticated
  using ((select auth.uid()) = user_id or public.is_admin())
  with check ((select auth.uid()) = user_id or public.is_admin());
