'use client';

import { useMemo } from 'react';

import {
  dictionaries,
  fallbackLanguage,
  type DictionaryKey,
  type SupportedLanguage,
} from '@/lib/i18n';
import { useAuthStore } from '@/store/auth.store';

type TranslationApi = {
  language: SupportedLanguage;
  t: (key: DictionaryKey) => string;
};

export function useTranslation(): TranslationApi {
  // Language enum values ('et'/'ru') are valid SupportedLanguage keys at runtime
  const language = useAuthStore((state) => state.language) as SupportedLanguage;

  return useMemo(() => {
    const dictionary = dictionaries[language] ?? dictionaries[fallbackLanguage];

    return {
      language,
      t: (key: DictionaryKey) => dictionary[key] ?? dictionaries[fallbackLanguage][key] ?? key,
    };
  }, [language]);
}
