import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      active="signup"
      title="새로운 동료를 환영합니다."
      subtitle="관리자에게 받은 초대 코드와 함께 가입해주세요."
    >
      <SignupForm />
    </AuthShell>
  );
}
