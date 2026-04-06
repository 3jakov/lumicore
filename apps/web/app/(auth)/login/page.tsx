import { AuthIntroCard } from '@/components/layout/auth-intro-card';
import { PlaceholderAuthPanel } from '@/components/layout/placeholder-auth-panel';

export default function LoginPage(): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
      <AuthIntroCard />
      <PlaceholderAuthPanel />
    </div>
  );
}
