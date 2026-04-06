import { AuthIntroCard } from '@/components/layout/auth-intro-card';
import { LoginPanel } from '@/components/auth/login-panel';

export default function LoginPage(): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
      <AuthIntroCard />
      <LoginPanel />
    </div>
  );
}
