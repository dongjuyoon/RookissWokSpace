"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/auth";
import ProfilePanel from "./ProfilePanel";
import styles from "./app.module.css";

type MenuItem = { no: string; label: string; href?: string; badge?: number };

const WORKSPACE = (noticeCount: number): MenuItem[] => [
  { no: "01", label: "홈", href: "/home" },
  { no: "02", label: "게시판", href: "/notices", badge: noticeCount },
  { no: "03", label: "조직도", href: "/directory" },
  { no: "04", label: "근태", href: "/attendance" },
  { no: "05", label: "휴가 신청", href: "/leave" },
  { no: "09", label: "회의실 예약", href: "/rooms" },
];

// 관리자에게만 보이는 메뉴 (연결된 화면만 링크)
const ADMIN: MenuItem[] = [
  { no: "06", label: "가입 승인", href: "/admin" },
  { no: "07", label: "초대 코드", href: "/admin/invites" },
  { no: "08", label: "구성원 관리", href: "/admin/members" },
];

export default function AppSidebar({
  profile,
  noticeCount,
}: {
  profile: Profile;
  noticeCount: number;
}) {
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderItem(item: MenuItem) {
    const content = (
      <>
        {item.label}
        {item.badge !== undefined ? (
          <span className={styles.badge}>{item.badge}</span>
        ) : (
          <span className={styles.navNo}>{item.no}</span>
        )}
      </>
    );

    if (!item.href) {
      return (
        <span key={item.no} className={`${styles.navItem} ${styles.navItemDisabled}`}>
          {content}
        </span>
      );
    }
    const active = isActive(item.href);
    return (
      <Link
        key={item.no}
        href={item.href}
        className={`${styles.navItem} ${active ? styles.navActive : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>R</span>
        <div className={styles.brandText}>
          <span className={styles.brandName}>RookissAI</span>
          <span className={styles.brandSub}>WorkSpace · v1.0.0</span>
        </div>
      </div>

      <input className={styles.search} placeholder="빠른 검색" aria-label="빠른 검색" />

      <div className={styles.sectionLabel}>워크스페이스</div>
      <nav className={styles.nav}>{WORKSPACE(noticeCount).map(renderItem)}</nav>

      {profile.role === "admin" && (
        <>
          <div className={styles.sectionLabel}>관리</div>
          <nav className={styles.nav}>{ADMIN.map(renderItem)}</nav>
        </>
      )}

      <button
        type="button"
        className={styles.profileButton}
        onClick={() => setPanelOpen(true)}
        aria-label="내 정보 열기"
      >
        <span className={styles.avatar}>{profile.name.charAt(0)}</span>
        <span>
          <span className={styles.userNameLine}>
            {profile.name}
          </span>
          <span className={styles.userTitleLine}>
            {profile.title}
          </span>
        </span>
        <span className={styles.chevron}>›</span>
      </button>

      {panelOpen && (
        <ProfilePanel profile={profile} onClose={() => setPanelOpen(false)} />
      )}
    </aside>
  );
}
