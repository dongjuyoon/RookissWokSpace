import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      active="login"
      title="다시 만나서 반가워요."
      subtitle="이메일과 비밀번호로 로그인해주세요."
    >
      <LoginForm />
    </AuthShell>
  );
}
