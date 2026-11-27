import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

type Props = {
  active: "login" | "signup";
  title: string;
  subtitle: string;
  children: ReactNode;
};

// 로그인 · 회원가입 화면 공통 틀 (왼쪽 어두운 배너 + 오른쪽 폼)
export default function AuthShell({ active, title, subtitle, children }: Props) {
  return (
    <main className={styles.layout}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logo}>R</span>
          <span className={styles.brandName}>RookissAI</span>
          <span className={styles.version}>v1.0.0 · INTERNAL</span>
        </div>

        <div className={styles.hero}>
          <h1 className={styles.headline}>
            함께 일하는 <span className={styles.accent}>모든 순간</span>
            <br />
            을 한 곳에서.
          </h1>
          <p className={styles.lead}>
            시작부터 마무리까지, 끊김 없는 하루. 협업에 필요한 모든 기능을 하나의
            공간에 담았습니다.
          </p>
        </div>

        <p className={styles.status}>
          <span className={styles.statusDot} />
          SYSTEM OPERATIONAL
        </p>
      </section>

      <section className={styles.formArea}>
        <div className={styles.formBox}>
          <nav className={styles.tabs} aria-label="인증 메뉴">
            {active === "login" ? (
              <span className={styles.tabActive} aria-current="page">
                로그인
              </span>
            ) : (
              <Link href="/login" className={styles.tabLink}>
                로그인
              </Link>
            )}
            {active === "signup" ? (
              <span className={styles.tabActive} aria-current="page">
                회원가입
              </span>
            ) : (
              <Link href="/signup" className={styles.tabLink}>
                회원가입
              </Link>
            )}
          </nav>

          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>

          {children}
        </div>
      </section>
    </main>
  );
}
