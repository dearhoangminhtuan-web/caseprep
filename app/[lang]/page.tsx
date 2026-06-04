import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Lang } from '@/types'

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/${lang}/dashboard`)

  const features = [
    { title: dict.landing.feature_cases_title, desc: dict.landing.feature_cases_desc, emoji: '📚' },
    { title: dict.landing.feature_frameworks_title, desc: dict.landing.feature_frameworks_desc, emoji: '🗺️' },
    { title: dict.landing.feature_facts_title, desc: dict.landing.feature_facts_desc, emoji: '🔢' },
    { title: dict.landing.feature_quiz_title, desc: dict.landing.feature_quiz_desc, emoji: '⚡' },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-4 py-24 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium border border-white/20">
              {dict.landing.pill_en} + {dict.landing.pill_jp}
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {dict.landing.hero_title}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-indigo-200 leading-relaxed">
            {dict.landing.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${lang}/signup`}
              className="rounded-xl bg-white px-8 py-3 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-lg"
            >
              {dict.landing.cta_start}
            </Link>
            <Link
              href={`/${lang}/cases`}
              className="rounded-xl border border-white/30 px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {dict.landing.cta_sample}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
              <div className="mb-3 text-3xl">{f.emoji}</div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification section */}
      <section className="bg-indigo-50 dark:bg-slate-800/50 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 text-4xl">🏆</div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
            {dict.landing.gamification_title}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {dict.landing.gamification_desc}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['⚡ XP', '📈 Levels', '🔥 Streaks', '🎯 Quizzes'].map((item) => (
              <span key={item} className="rounded-full bg-white dark:bg-slate-700 border px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-600">
                {item}
              </span>
            ))}
          </div>
          <Link
            href={`/${lang}/signup`}
            className="mt-8 inline-flex rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {dict.landing.cta_start}
          </Link>
        </div>
      </section>
    </div>
  )
}
