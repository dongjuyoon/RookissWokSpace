"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signUp } from "@/lib/auth";
import styles from "@/components/auth/auth.module.css";

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "");

    setPending(true);
    setError(null);
    const result = await signUp({
      inviteCode: get("inviteCode"),
      email: get("email"),
      password: get("password"),
      name: get("name"),
      title: get("title"),
      department: get("department"),
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <p className={styles.success}>
          가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.
        </p>
        <Link href="/login" className={styles.linkButton}>
          로그인 화면으로
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="inviteCode">
        초대 코드 <span className={styles.hint}>— 관리자 발급</span>
      </label>
      <input
        id="inviteCode"
        name="inviteCode"
        placeholder="RKS-2026"
        autoComplete="off"
        required
        className={`${styles.input} ${styles.mono}`}
      />

      <label className={styles.label} htmlFor="email">
        이메일
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="hong.gildong@example.com"
        required
        className={styles.input}
      />

      <label className={styles.label} htmlFor="password">
        비밀번호 <span className={styles.hint}>— 8자 이상</span>
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        className={styles.input}
      />

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="name">
            이름
          </label>
          <input
            id="name"
            name="name"
            placeholder="홍길동"
            required
            className={styles.input}
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="title">
            직책
          </label>
          <input
            id="title"
            name="title"
            placeholder="백엔드 개발자"
            className={styles.input}
          />
        </div>
      </div>

      <label className={styles.label} htmlFor="department">
        부서
      </label>
      <input
        id="department"
        name="department"
        placeholder="개발"
        className={styles.input}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={pending}>
        가입 신청
      </button>
      <p className={styles.note}>가입 후 관리자 승인을 거쳐 활성화됩니다.</p>
    </form>
  );
}
