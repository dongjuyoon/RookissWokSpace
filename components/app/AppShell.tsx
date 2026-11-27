import type { ReactNode } from "react";
import type { Profile } from "@/lib/auth";
import AppSidebar from "./AppSidebar";
import styles from "./app.module.css";

// 로그인한 뒤의 모든 화면 틀: 왼쪽 사이드바 + 오른쪽 본문
export default function AppShell({
  profile,
  noticeCount,
  children,
}: {
  profile: Profile;
  noticeCount: number;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <AppSidebar profile={profile} noticeCount={noticeCount} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
