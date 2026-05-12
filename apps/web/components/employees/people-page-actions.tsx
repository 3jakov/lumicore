'use client';

import Link from 'next/link';

import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth.store';

export function PeoplePageActions(): JSX.Element | null {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;

  if (!isAdmin) return null;

  return (
    <Link
      href="/team/people/new"
      className="inline-flex items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
    >
      {t('team.people.create')}
    </Link>
  );
}
