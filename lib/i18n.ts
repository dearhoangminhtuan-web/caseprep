import type { Lang } from '@/types'

export const LOCALES: Lang[] = ['en', 'ja']
export const DEFAULT_LOCALE: Lang = 'en'

export function hasLocale(value: string): value is Lang {
  return (LOCALES as string[]).includes(value)
}

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ja: () => import('./dictionaries/ja.json').then((m) => m.default),
}

export async function getDictionary(lang: Lang) {
  return dictionaries[lang]?.() ?? dictionaries[DEFAULT_LOCALE]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
