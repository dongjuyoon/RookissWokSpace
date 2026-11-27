"use server";

// 휴가 화면과 홈 위젯이 부르는 함수입니다. 구성원은 본인 신청만, 관리자는 전사 신청을 읽습니다 (RLS 가 막습니다).
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ANNUAL_LEAVE_DAYS, LEAVE_KINDS, type LeaveStatus } from "@/lib/leave-meta";

export type LeaveRow = {
  id: string;
  requesterName: string;
  requesterDepartment: string;
  kind: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
};

// 신청 목록. 관리자는 전사, 구성원은 본인 것만 나옵니다. 대기 건을 위로 올리지 않고 신청 최신순으로 둡니다.
export async function listLeaves(): Promise<LeaveRow[]> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select(
      "id, kind, start_date, end_date, days, reason, status, created_at, requester:profiles!leave_requests_user_id_fkey(name, department)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("휴가 신청 내역을 불러오지 못했습니다.");

  return (data ?? []).map((row) => {
    const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;
    return {
      id: row.id,
      requesterName: requester?.name ?? "",
      requesterDepartment: requester?.department ?? "",
      kind: row.kind,
      startDate: row.start_date,
      endDate: row.end_date,
      days: row.days,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

// 신청: 새 건은 항상 대기로 들어갑니다.
export async function createLeave(formData: FormData): Promise<void> {
  const profile = await requireApprovedProfile();
  const kind = String(formData.get("kind") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!(LEAVE_KINDS as readonly string[]).includes(kind)) {
    throw new Error("휴가 종류를 확인해주세요.");
  }
  if (!startDate || !endDate || endDate < startDate) {
    throw new Error("시작일과 종료일을 확인해주세요.");
  }
  if (!reason) {
    throw new Error("사유를 입력해주세요.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leave_requests").insert({
    user_id: profile.id,
    kind,
    start_date: startDate,
    end_date: endDate,
    reason,
    status: "pending",
  });
  if (error) throw new Error("휴가를 신청하지 못했습니다.");
  revalidatePath("/leave");
  revalidatePath("/home");
}

// 결재: 대기 건만 바꿉니다.
async function decide(id: string, status: "approved" | "rejected") {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leave_requests")
    .update({ status, decided_by: admin.id, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error("처리하지 못했습니다.");
  revalidatePath("/leave");
  revalidatePath("/home");
}

export async function approveLeave(id: string): Promise<void> {
  await decide(id, "approved");
}

export async function rejectLeave(id: string): Promise<void> {
  await decide(id, "rejected");
}

// 올해 남은 연차 = 기준 일수 - 올해 승인된 연차 일수
export async function remainingAnnualLeave(): Promise<{ total: number; remaining: number }> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const year = formatDate(new Date()).slice(0, 4);
  const { data, error } = await supabase
    .from("leave_requests")
    .select("days")
    .eq("status", "approved")
    .eq("kind", "연차")
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);
  if (error) throw new Error("연차 현황을 불러오지 못했습니다.");

  const used = (data ?? []).reduce((sum, row) => sum + row.days, 0);
  return { total: ANNUAL_LEAVE_DAYS, remaining: Math.max(ANNUAL_LEAVE_DAYS - used, 0) };
}
