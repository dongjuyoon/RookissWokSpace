import { requireAdminProfile } from "@/lib/auth";

// /admin 아래 모든 화면은 승인된 관리자만 봅니다. (틀은 (app)/layout.tsx 가 씁니다)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminProfile();
  return <>{children}</>;
}
