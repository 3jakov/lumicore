'use client';

import { useTranslation } from '@/hooks/use-translation';

export function LanguageBadge(): JSX.Element {
  const { language } = useTranslation();

  return <div className="pill">{language.toUpperCase()}</div>;
}
