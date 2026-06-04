import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import LoginForm from '@/components/auth/LoginForm'
import type { Lang } from '@/types'

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.auth

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/${lang}/dashboard`)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="mb-6 text-center">
            <span className="text-4xl">🥋</span>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{d.login_title}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d.login_subtitle}</p>
          </div>
          <LoginForm dict={dict} lang={lang} />
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {d.no_account}{' '}
            <Link href={`/${lang}/signup`} className="font-medium text-indigo-600 hover:text-indigo-700">
              {dict.nav.signup}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
