'use client';

import { useMemo } from 'react';

import {
  dictionaries,
  fallbackLanguage,
  type Dictionary,
  type DictionaryKey,
  type SupportedLanguage,
} from '@/lib/i18n';
import { useAuthStore } from '@/store/auth.store';

type TranslationApi = {
  language: SupportedLanguage;
  t: (key: DictionaryKey) => string;
};

function resolveTranslation(dictionary: Dictionary, key: DictionaryKey): string | undefined {
  let current: unknown = dictionary;

  for (const segment of key.split('.')) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

export function useTranslation(): TranslationApi {
  // Language enum values ('et'/'ru') are valid SupportedLanguage keys at runtime
  const language = useAuthStore((state) => state.language) as SupportedLanguage;

  return useMemo(() => {
    const dictionary = dictionaries[language] ?? dictionaries[fallbackLanguage];

    return {
      language,
      t: (key: DictionaryKey) =>
        resolveTranslation(dictionary, key) ??
        resolveTranslation(dictionaries[fallbackLanguage], key) ??
        key,
    };
  }, [language]);
}
