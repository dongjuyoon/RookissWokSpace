"use client";

import { signOut, type Profile } from "@/lib/auth";
import { tenureLabel } from "@/lib/format";
import styles from "./app.module.css";

// 사이드바 프로필을 누르면 오른쪽에서 나오는 패널
export default function ProfilePanel({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-label="내 정보">
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelName}>{profile.name}</p>
            <p className={styles.panelSub}>
              {[profile.title, profile.department].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt>입사일</dt>
            <dd>{profile.joinedOn ?? "—"}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>근속</dt>
            <dd>{tenureLabel(profile.joinedOn)}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>사번</dt>
            <dd>{profile.employeeNo ?? "—"}</dd>
          </div>
        </dl>

        <form action={signOut}>
          <button type="submit" className={`${styles.secondaryButton} ${styles.fullWidth}`}>
            로그아웃
          </button>
        </form>
      </aside>
    </>
  );
}
