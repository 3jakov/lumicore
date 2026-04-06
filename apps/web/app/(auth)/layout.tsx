import type { ReactNode } from 'react';

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,145,74,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(60,143,137,0.14),transparent_28%)]" />
      <div className="relative z-10 w-full max-w-md lg:max-w-5xl">{children}</div>
    </div>
  );
}
