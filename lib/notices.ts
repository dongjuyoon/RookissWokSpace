"use server";

// 게시판 화면이 부르는 함수입니다. 글 저장과 읽기는 모두 여기서 합니다.
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile, requireApprovedProfile } from "@/lib/auth";
import { NOTICE_CATEGORIES, type NoticeCategory } from "@/lib/notice-meta";

export type NoticeListItem = {
  id: string;
  category: string;
  pinned: boolean;
  title: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
};

export type NoticeDetail = {
  id: string;
  category: string;
  pinned: boolean;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

// 고정 글을 먼저, 그다음 최신순으로 돌려줍니다.
export async function listNotices(): Promise<NoticeListItem[]> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notices")
    .select("id, category, pinned, title, author_name, created_at, notice_comments(count)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("게시글을 불러오지 못했습니다.");

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    pinned: row.pinned,
    title: row.title,
    authorName: row.author_name,
    createdAt: row.created_at,
    commentCount: row.notice_comments?.[0]?.count ?? 0,
  }));
}

// 사이드바 배지에 쓰는 전체 글 수
export async function countNotices(): Promise<number> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("notices")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

// 글 한 개. 없거나 읽을 수 없으면 null 입니다.
export async function getNotice(id: string): Promise<NoticeDetail | null> {
  await requireApprovedProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notices")
    .select("id, category, pinned, title, body, author_name, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    category: data.category,
    pinned: data.pinned,
    title: data.title,
    body: data.body,
    authorName: data.author_name,
    createdAt: data.created_at,
  };
}

// 새 글은 관리자만 씁니다.
export async function createNotice(formData: FormData): Promise<void> {
  const admin = await requireAdminProfile();

  const category = String(formData.get("category") ?? "") as NoticeCategory;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  if (!NOTICE_CATEGORIES.includes(category) || !title) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notices").insert({
    category,
    pinned,
    title,
    body,
    author_name: admin.name,
    author_id: admin.id,
  });
  if (error) throw new Error("글을 등록하지 못했습니다.");

  revalidatePath("/notices");
  revalidatePath("/home");
}
