import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// 서버 컴포넌트 · 서버 액션용 Supabase 클라이언트 (쿠키에 세션을 둡니다).
export async function createSupabaseServerClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. proxy 가 세션을 갱신합니다.
        }
      },
    },
  });
}
