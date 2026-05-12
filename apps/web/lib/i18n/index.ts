import { et } from '@/lib/i18n/et';
import { ru } from '@/lib/i18n/ru';

type DeepStringShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringShape<T[K]>;
};

type Dictionary = DeepStringShape<typeof et>;
type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKeyOf<T[K]>}`;
}[keyof T & string];

export const dictionaries = {
  et,
  ru,
} as const;

export const fallbackLanguage = 'et' as const;

export type SupportedLanguage = keyof typeof dictionaries;
export type DictionaryKey = NestedKeyOf<Dictionary>;
export type { Dictionary };
