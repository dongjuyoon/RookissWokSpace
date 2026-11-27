"use server";

// 화면은 이 파일과 lib/admin.ts 의 함수만 부릅니다. Supabase 호출은 lib/ 안에만 둡니다.
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  name: string;
  title: string;
  department: string;
  role: "member" | "admin";
  status: "pending" | "approved" | "rejected";
  employeeNo: string | null;
  joinedOn: string | null; // YYYY-MM-DD
};

const MESSAGE = {
  invalidLogin: "이메일 또는 비밀번호가 올바르지 않습니다.",
  pending: "아직 승인 대기 중입니다. 관리자 승인 후 로그인할 수 있습니다.",
  rejected: "가입이 승인되지 않았습니다. 관리자에게 문의해주세요.",
  badInvite: "초대 코드가 올바르지 않거나 이미 사용된 코드입니다.",
  duplicate: "이미 가입된 이메일입니다.",
  signupFailed: "가입하지 못했습니다. 입력한 내용을 확인해주세요.",
  rateLimited: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
};

// 이메일과 비밀번호로 로그인합니다. 승인되지 않은 계정은 세션을 끊고 막습니다.
export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) {
    return { error: MESSAGE.invalidLogin };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.status !== "approved") {
    await supabase.auth.signOut();
    if (profile?.status === "pending") return { error: MESSAGE.pending };
    if (profile?.status === "rejected") return { error: MESSAGE.rejected };
    return { error: MESSAGE.invalidLogin };
  }

  // 로그인하면 접속 중으로 켭니다.
  await supabase.rpc("set_online", { p_online: true });
  return { error: null };
}

export type SignUpInput = {
  inviteCode: string;
  email: string;
  password: string;
  name: string;
  title: string;
  department: string;
};

// 초대 코드와 함께 가입 신청합니다. 가입 직후에는 승인 대기이므로 세션을 끊습니다.
export async function signUp(
  input: SignUpInput,
): Promise<{ error: string | null }> {
  const code = input.inviteCode.trim();
  const email = input.email.trim();
  const name = input.name.trim();
  if (!code || !email || !name || input.password.length < 8) {
    return { error: MESSAGE.signupFailed };
  }

  const supabase = await createSupabaseServerClient();
  const { data: usable } = await supabase.rpc("check_invite_code", {
    p_code: code,
  });
  if (!usable) {
    return { error: MESSAGE.badInvite };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        invite_code: code,
        name,
        title: input.title.trim(),
        department: input.department.trim(),
      },
    },
  });
  if (error) {
    // 실제 원인은 터미널(서버 로그)에서 확인할 수 있습니다.
    console.error("[signUp] Supabase 가입 실패:", error.status, error.code, error.message);
    if (error.status === 429) return { error: MESSAGE.rateLimited };
    if (/already/i.test(error.message)) return { error: MESSAGE.duplicate };
    if (/invite/i.test(error.message)) return { error: MESSAGE.badInvite };
    return { error: MESSAGE.signupFailed };
  }

  await supabase.auth.signOut();
  return { error: null };
}

// 로그아웃하고 로그인 화면으로 보냅니다.
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // 로그아웃하면 접속 중 표시를 끕니다. (세션이 있어야 하므로 먼저 실행합니다)
  await supabase.rpc("set_online", { p_online: false });
  await supabase.auth.signOut();
  redirect("/login");
}

// 로그인한 사용자의 프로필. 로그인하지 않았거나 프로필이 없으면 null 입니다.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("email, name, title, department, role, status, employee_no, joined_on")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: user.id,
    email: data.email ?? user.email ?? "",
    name: data.name,
    title: data.title,
    department: data.department,
    role: data.role,
    status: data.status,
    employeeNo: data.employee_no,
    joinedOn: data.joined_on,
  };
}

// 승인된 구성원만 통과합니다. 아니면 로그인 화면으로 보냅니다.
export async function requireApprovedProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") redirect("/login");
  return profile;
}

// 승인된 관리자만 통과합니다. 구성원이면 홈으로 보냅니다.
export async function requireAdminProfile(): Promise<Profile> {
  const profile = await requireApprovedProfile();
  if (profile.role !== "admin") redirect("/home");
  return profile;
}
