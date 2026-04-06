import { et } from '@/lib/i18n/et';
import { ru } from '@/lib/i18n/ru';

export const dictionaries = {
  et,
  ru,
} as const;

export const fallbackLanguage = 'et' as const;

export type SupportedLanguage = keyof typeof dictionaries;
export type DictionaryKey = keyof typeof et;
