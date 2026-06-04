import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import QuizModeSelector from '@/components/quiz/QuizModeSelector'
import type { Lang } from '@/types'

export default async function QuizPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.quiz

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{d.subtitle}</p>
      </div>
      <QuizModeSelector lang={lang} dict={dict} />
    </div>
  )
}
