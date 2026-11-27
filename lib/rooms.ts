"use server";

// 회의실 예약 화면이 부르는 함수입니다. 조회는 승인된 구성원 모두, 수정은 예약자 본인과 관리자만 합니다.
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  DAY_END,
  DAY_START,
  TIME_OPTIONS,
  addDays,
  isRoomNo,
  type RoomNo,
} from "@/lib/rooms-meta";

export type Reservation = {
  id: string;
  roomNo: string;
  userId: string;
  bookerName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  title: string;
};

function toReservation(row: {
  id: string;
  room_no: string;
  user_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  title: string;
  booker: { name: string } | { name: string }[] | null;
}): Reservation {
  const booker = Array.isArray(row.booker) ? row.booker[0] : row.booker;
  return {
    id: row.id,
    roomNo: row.room_no,
    userId: row.user_id,
    bookerName: booker?.name ?? "",
    date: row.reservation_date,
    start: row.start_time.slice(0, 5),
    end: row.end_time.slice(0, 5),
    title: row.title,
  };
}

const SELECT =
  "id, room_no, user_id, reservation_date, start_time, end_time, title, booker:profiles!room_reservations_user_id_fkey(name)";

// 오늘 방별 예약 건수 (방 목록 화면)
export async function countRoomsToday(): Promise<Record<string, number>> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const today = formatDate(new Date());
  const { data, error } = await supabase
    .from("room_reservations")
    .select("room_no")
    .eq("reservation_date", today);
  if (error) throw new Error("예약 현황을 불러오지 못했습니다.");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.room_no] = (counts[row.room_no] ?? 0) + 1;
  }
  return counts;
}

// 한 방의 한 주(월요일 시작 7일) 예약
export async function listWeekReservations(roomNo: RoomNo, monday: string): Promise<Reservation[]> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("room_reservations")
    .select(SELECT)
    .eq("room_no", roomNo)
    .gte("reservation_date", monday)
    .lte("reservation_date", addDays(monday, 6))
    .order("reservation_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error("예약 시간표를 불러오지 못했습니다.");
  return (data ?? []).map(toReservation);
}

export async function getReservation(id: string): Promise<Reservation | null> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("room_reservations")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("예약을 불러오지 못했습니다.");
  return data ? toReservation(data) : null;
}

// 입력 검증: 날짜 형식, 30분 단위 시각, 종료가 시작보다 뒤, 제목 필수
function readSlot(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜를 확인해주세요.");
  if (!TIME_OPTIONS.includes(start) || !TIME_OPTIONS.includes(end)) {
    throw new Error(`시간은 ${DAY_START} ~ ${DAY_END} 사이에서 30분 단위로 골라주세요.`);
  }
  if (end <= start) throw new Error("종료 시각은 시작 시각보다 뒤여야 합니다.");
  if (!title) throw new Error("제목을 입력해주세요.");
  if (title.length > 60) throw new Error("제목은 60자 이내로 입력해주세요.");
  return { date, start, end, title };
}

// 겹침은 DB 트리거가 최종으로 막고, 여기서는 그 오류를 한국어로 바꿉니다.
function mapWriteError(error: { message: string }): Error {
  if (error.message.includes("room overlap")) {
    return new Error("이미 그 시간에 예약이 있습니다.");
  }
  return new Error("예약을 저장하지 못했습니다.");
}

export async function createReservation(formData: FormData): Promise<void> {
  const profile = await requireApprovedProfile();
  const roomNo = String(formData.get("roomNo") ?? "");
  if (!isRoomNo(roomNo)) throw new Error("회의실 번호를 확인해주세요.");
  const slot = readSlot(formData);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("room_reservations").insert({
    room_no: roomNo,
    user_id: profile.id,
    reservation_date: slot.date,
    start_time: slot.start,
    end_time: slot.end,
    title: slot.title,
  });
  if (error) throw mapWriteError(error);
  revalidatePath(`/rooms/${roomNo}`);
  revalidatePath("/rooms");
}

// 수정: 예약자 본인 또는 관리자만. 방은 바꾸지 않고 날짜·시각·제목만 고칩니다.
export async function updateReservation(formData: FormData): Promise<void> {
  const profile = await requireApprovedProfile();
  const id = String(formData.get("id") ?? "");
  const slot = readSlot(formData);

  const supabase = await createSupabaseServerClient();
  const { data: current, error: readError } = await supabase
    .from("room_reservations")
    .select("user_id, room_no")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw new Error("예약을 불러오지 못했습니다.");
  if (!current) throw new Error("예약을 찾을 수 없습니다.");
  if (current.user_id !== profile.id && profile.role !== "admin") {
    throw new Error("본인이 만든 예약만 수정할 수 있습니다.");
  }

  const { error } = await supabase
    .from("room_reservations")
    .update({
      reservation_date: slot.date,
      start_time: slot.start,
      end_time: slot.end,
      title: slot.title,
    })
    .eq("id", id);
  if (error) throw mapWriteError(error);
  revalidatePath(`/rooms/${current.room_no}`);
  revalidatePath("/rooms");
}
