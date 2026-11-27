import type { ReactNode } from "react";
import Clock from "./Clock";
import styles from "./app.module.css";

// 본문 공통 틀: 상단바(번호 / 메뉴 이름 · 시각) + 제목 줄 + 내용
export default function AppPage({
  number,
  crumb,
  heading,
  aside,
  children,
}: {
  number: string;
  crumb: string;
  heading?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.crumb}>
          <span className={styles.crumbNo}>{number}</span>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCurrent}>{crumb}</span>
        </div>
        <Clock />
      </header>
      <div className={styles.body}>
        {heading && (
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>{heading}</h1>
            {aside && <div className={styles.aside}>{aside}</div>}
          </div>
        )}
        {children}
      </div>
    </>
  );
}
