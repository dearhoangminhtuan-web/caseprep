import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

export default async function RootPage() {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('lang')?.value
  const lang =
    langCookie && (LOCALES as string[]).includes(langCookie)
      ? langCookie
      : DEFAULT_LOCALE
  redirect(`/${lang}`)
}
