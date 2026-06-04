import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import QuizRunner from '@/components/quiz/QuizRunner'
import { getMathQuestions } from '@/lib/mathQuestions'
import type { Lang, QuizMode, QuizQuestion } from '@/types'

const VALID_MODES: QuizMode[] = ['math', 'framework', 'fact']

export default async function QuizModePage({
  params,
}: {
  params: Promise<{ lang: string; mode: string }>
}) {
  const { lang: rawLang, mode: rawMode } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)

  if (!VALID_MODES.includes(rawMode as QuizMode)) notFound()
  const mode = rawMode as QuizMode

  const supabase = await createServerSupabaseClient()
  let questions: QuizQuestion[] = []

  if (mode === 'math') {
    questions = getMathQuestions(8)
  } else if (mode === 'framework') {
    const { data: frameworks } = await supabase
      .from('frameworks')
      .select('id, name_en, name_ja, when_to_use_en, when_to_use_ja, body_en, category')
      .order('sort_order')

    if (frameworks && frameworks.length > 0) {
      // Generate "when to use" questions
      const shuffled = [...frameworks].sort(() => Math.random() - 0.5).slice(0, 8)
      questions = shuffled.map((f, i) => {
        const name = lang === 'ja' ? f.name_ja || f.name_en : f.name_en
        const other = frameworks.filter(fw => fw.id !== f.id).sort(() => Math.random() - 0.5).slice(0, 3)
        const correctIndex = Math.floor(Math.random() * 4)
        const options = [...other.map(fw => lang === 'ja' ? fw.name_ja || fw.name_en : fw.name_en)]
        options.splice(correctIndex, 0, name)
        const when = lang === 'ja' ? f.when_to_use_ja || f.when_to_use_en : f.when_to_use_en

        return {
          id: `fw-${i}`,
          question: `Which framework is best described as: "${when.substring(0, 100)}..."?`,
          options,
          correct_index: correctIndex,
          explanation: `${name}: ${when}`,
        }
      })
    }
  } else if (mode === 'fact') {
    const { data: facts } = await supabase
      .from('facts')
      .select('id, label_en, label_ja, value_text, category')
      .not('category', 'is', null)
      .order('created_at')

    if (facts && facts.length > 0) {
      const shuffled = [...facts].sort(() => Math.random() - 0.5).slice(0, 8)
      questions = shuffled.map((f, i) => {
        const label = lang === 'ja' ? f.label_ja || f.label_en : f.label_en
        const other = facts.filter(ff => ff.id !== f.id && ff.category === f.category).sort(() => Math.random() - 0.5).slice(0, 3)
        const fallback = facts.filter(ff => ff.id !== f.id).sort(() => Math.random() - 0.5).slice(0, 3)
        const distractors = other.length >= 3 ? other : fallback
        const correctIndex = Math.floor(Math.random() * 4)
        const options = [...distractors.slice(0, 3).map(ff => ff.value_text)]
        options.splice(correctIndex, 0, f.value_text)

        return {
          id: `fact-${i}`,
          question: `What is the ${label}?`,
          options,
          correct_index: correctIndex,
          explanation: `${label}: ${f.value_text}`,
        }
      })
    }
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Not enough content to generate a quiz yet.</p>
        <Link href={`/${lang}/quiz`} className="mt-4 inline-block text-indigo-600 hover:underline">
          ← {dict.quiz.back}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href={`/${lang}/quiz`} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
          ← {dict.quiz.back}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {dict.quiz[`mode_${mode}` as keyof typeof dict.quiz] as string}
        </span>
      </div>
      <QuizRunner questions={questions} mode={mode} lang={lang} dict={dict} />
    </div>
  )
}
