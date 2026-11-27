"use server";

// 근태 화면과 홈 위젯이 부르는 함수입니다. 출근·퇴근은 서버 시각(한국 시간 날짜 기준)으로 찍습니다.
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export type AttendanceRow = {
  id: string;
  workDate: string; // YYYY-MM-DD
  checkIn: string; // ISO
  checkOut: string | null; // ISO
};

// 오늘(한국 시간)의 날짜
function todayString(): string {
  return formatDate(new Date());
}

// 오늘 근태 한 줄 (없으면 null)
export async function getTodayAttendance(): Promise<AttendanceRow | null> {
  const profile = await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, work_date, check_in, check_out")
    .eq("user_id", profile.id)
    .eq("work_date", todayString())
    .maybeSingle();
  if (error) throw new Error("오늘의 근태를 불러오지 못했습니다.");
  if (!data) return null;
  return {
    id: data.id,
    workDate: data.work_date,
    checkIn: data.check_in,
    checkOut: data.check_out,
  };
}

// 최근 30일 (오늘 포함) 기록. 최신 날짜가 위로 옵니다.
export async function listRecentAttendance(): Promise<AttendanceRow[]> {
  const profile = await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const since = formatDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  const { data, error } = await supabase
    .from("attendance")
    .select("id, work_date, check_in, check_out")
    .eq("user_id", profile.id)
    .gte("work_date", since)
    .order("work_date", { ascending: false });
  if (error) throw new Error("근태 기록을 불러오지 못했습니다.");
  return (data ?? []).map((row) => ({
    id: row.id,
    workDate: row.work_date,
    checkIn: row.check_in,
    checkOut: row.check_out,
  }));
}

// 출근: 오늘 줄을 만듭니다. 하루에 한 번만 됩니다.
export async function checkIn(): Promise<void> {
  const profile = await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("attendance")
    .insert({ user_id: profile.id, work_date: todayString() });
  if (error) {
    if (error.code === "23505") throw new Error("오늘은 이미 출근을 찍었습니다.");
    throw new Error("출근을 기록하지 못했습니다.");
  }
  revalidatePath("/home");
  revalidatePath("/attendance");
}

// 퇴근: 오늘 줄의 퇴근 시각을 채웁니다. 출근 기록이 없거나 이미 퇴근했다면 아무 일도 하지 않습니다.
export async function checkOut(): Promise<void> {
  const profile = await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .update({ check_out: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("work_date", todayString())
    .is("check_out", null)
    .select("id");
  if (error) throw new Error("퇴근을 기록하지 못했습니다.");
  if (!data || data.length === 0) throw new Error("퇴근할 출근 기록이 없습니다.");
  revalidatePath("/home");
  revalidatePath("/attendance");
}
