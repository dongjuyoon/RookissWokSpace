import AppShell from "@/components/app/AppShell";
import { requireApprovedProfile } from "@/lib/auth";
import { countNotices } from "@/lib/notices";

// 로그인 뒤 모든 화면(/home, /notices, /admin …)은 이 틀 안에 들어갑니다.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireApprovedProfile();
  const noticeCount = await countNotices();
  return (
    <AppShell profile={profile} noticeCount={noticeCount}>
      {children}
    </AppShell>
  );
}
