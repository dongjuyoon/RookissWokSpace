// Supabase 접속 정보. 값은 .env.local 에서 읽습니다.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣어주세요.");
  }
  return { url, key };
}
