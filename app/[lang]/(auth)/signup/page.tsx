import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import SignupForm from '@/components/auth/SignupForm'
import type { Lang } from '@/types'

export default async function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
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
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{d.signup_title}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d.signup_subtitle}</p>
          </div>
          <SignupForm dict={dict} lang={lang} />
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {d.have_account}{' '}
            <Link href={`/${lang}/login`} className="font-medium text-indigo-600 hover:text-indigo-700">
              {dict.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
