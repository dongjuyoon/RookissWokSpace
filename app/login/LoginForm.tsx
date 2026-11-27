"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/auth";
import styles from "@/components/auth/auth.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setPending(true);
    setError(null);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.replace("/home");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
        비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={styles.input}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={pending}>
        로그인
      </button>
    </form>
  );
}
