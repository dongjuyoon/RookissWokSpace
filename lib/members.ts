"use server";

// 지금 접속 중인 구성원 목록 (홈의 "지금 일하는 사람들")
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireApprovedProfile } from "@/lib/auth";

export type OnlineMember = {
  id: string;
  name: string;
  title: string;
  department: string;
};

export async function listOnlineMembers(): Promise<OnlineMember[]> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, title, department")
    .eq("online", true)
    .eq("status", "approved")
    .order("name", { ascending: true });
  if (error) throw new Error("접속 중인 구성원을 불러오지 못했습니다.");
  return data ?? [];
}
