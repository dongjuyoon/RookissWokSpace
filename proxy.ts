import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// 세션을 갱신하고, 로그인하지 않은 사용자는 안쪽 화면에서 막습니다.
// 승인 여부와 관리자 여부는 각 화면의 require 함수에서 확인합니다.
export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/home/:path*",
    "/notices/:path*",
    "/directory/:path*",
    "/attendance/:path*",
    "/leave/:path*",
    "/rooms/:path*",
    "/admin/:path*",
  ],
};
