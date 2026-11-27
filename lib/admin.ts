"use server";

// 관리자 화면(/admin, /admin/invites)이 부르는 함수입니다. 모든 함수는 관리자 확인을 먼저 합니다.
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

export type PendingMember = {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  createdAt: string;
};

export type InviteRow = {
  id: string;
  code: string;
  memo: string;
  createdByName: string | null;
  createdAt: string;
  usedByName: string | null;
  state: "available" | "used" | "revoked";
};

// 승인 대기 목록 (신청 순)
export async function listPendingMembers(): Promise<PendingMember[]> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, title, department, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error("승인 대기 목록을 불러오지 못했습니다.");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    title: row.title,
    department: row.department,
    createdAt: row.created_at,
  }));
}

async function setMemberStatus(id: string, status: "approved" | "rejected") {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error("처리하지 못했습니다.");
  revalidatePath("/admin");
  // 승인되면 조직도에도 바로 나타나도록 다시 읽게 합니다.
  revalidatePath("/directory");
}

export async function approveMember(id: string): Promise<void> {
  await setMemberStatus(id, "approved");
}

export async function rejectMember(id: string): Promise<void> {
  await setMemberStatus(id, "rejected");
}

// 초대 코드 목록 (발급 최신순)
export async function listInvites(): Promise<InviteRow[]> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invite_codes")
    .select(
      "id, code, memo, created_at, used_by, revoked_at, creator:profiles!invite_codes_created_by_fkey(name), user:profiles!invite_codes_used_by_fkey(name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("초대 코드 목록을 불러오지 못했습니다.");

  return (data ?? []).map((row) => {
    const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
    const user = Array.isArray(row.user) ? row.user[0] : row.user;
    let state: InviteRow["state"] = "available";
    if (row.revoked_at) state = "revoked";
    else if (row.used_by) state = "used";
    return {
      id: row.id,
      code: row.code,
      memo: row.memo,
      createdByName: creator?.name ?? null,
      createdAt: row.created_at,
      usedByName: user?.name ?? null,
      state,
    };
  });
}

// 헷갈리는 글자(0, O, 1, I)를 뺀 문자로 HR-XXXXXX 형식의 코드를 만듭니다.
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function makeInviteCode(): string {
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return `HR-${body}`;
}

// 메모를 받아 새 초대 코드를 발급합니다. 코드 값은 앱이 만듭니다.
export async function createInvite(formData: FormData): Promise<void> {
  const admin = await requireAdminProfile();
  const memo = String(formData.get("memo") ?? "").trim();
  if (!memo) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("invite_codes").insert({
    code: makeInviteCode(),
    memo,
    created_by: admin.id,
  });
  if (error) throw new Error("초대 코드를 발급하지 못했습니다.");
  revalidatePath("/admin/invites");
}

// 아직 쓰지 않은 코드만 회수합니다. 쓴 코드는 기록으로 남습니다.
export async function revokeInvite(id: string): Promise<void> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invite_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("used_by", null)
    .is("revoked_at", null);
  if (error) throw new Error("회수하지 못했습니다.");
  revalidatePath("/admin/invites");
}

// ----- 구성원 관리 (/admin/members) -----

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  employeeNo: string;
  department: string;
  title: string;
  role: "member" | "admin";
};

// 승인이 끝난 구성원 전체 (사번 순, 사번 없는 사람은 뒤로)
export async function listMembers(): Promise<{ rows: MemberRow[]; adminCount: number }> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, title, department, employee_no, role")
    .eq("status", "approved")
    .order("employee_no", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) throw new Error("구성원 목록을 불러오지 못했습니다.");

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    employeeNo: row.employee_no ?? "",
    department: row.department,
    title: row.title,
    role: row.role,
  }));
  return { rows, adminCount: rows.filter((row) => row.role === "admin").length };
}

// 사번 · 부서 · 직책 저장. 사번은 숫자 1~3자리(한 자리는 앞에 0을 붙여 두 자리로) 또는 비움만 받습니다.
export async function updateMember(formData: FormData): Promise<void> {
  await requireAdminProfile();
  const id = String(formData.get("id") ?? "");
  const rawNo = String(formData.get("employeeNo") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  let employeeNo: string | null = null;
  if (rawNo) {
    if (!/^\d{1,3}$/.test(rawNo)) throw new Error("사번은 숫자로 입력해주세요.");
    employeeNo = rawNo.padStart(2, "0");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ employee_no: employeeNo, department, title })
    .eq("id", id)
    .eq("status", "approved");
  if (error) {
    if (error.code === "23505") throw new Error("이미 다른 구성원이 쓰는 사번입니다.");
    throw new Error("저장하지 못했습니다.");
  }
  // 조직도와 홈(부서·직책 표시)에도 바로 보이게 전체를 다시 읽습니다.
  revalidatePath("/", "layout");
}

// 관리자 올리기 · 내리기. 마지막 관리자는 내릴 수 없습니다 (서버에서 한 번, DB 트리거에서 한 번 더 막습니다).
export async function setMemberRole(id: string, role: "member" | "admin"): Promise<void> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();

  if (role === "member") {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "approved")
      .neq("id", id);
    if (countError) throw new Error("처리하지 못했습니다.");
    if (!count) throw new Error("마지막 관리자의 권한은 내릴 수 없습니다.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .eq("status", "approved");
  if (error) throw new Error("처리하지 못했습니다.");
  revalidatePath("/", "layout");
}
