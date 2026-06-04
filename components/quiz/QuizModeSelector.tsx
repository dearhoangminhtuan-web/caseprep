import Link from 'next/link'
import type { Lang } from '@/types'
import type { Dictionary } from '@/lib/i18n'

interface QuizModeSelectorProps {
  lang: Lang
  dict: Dictionary
}

const modes = [
  { key: 'math', emoji: '🔢' },
  { key: 'framework', emoji: '🗺️' },
  { key: 'fact', emoji: '📖' },
] as const

export default function QuizModeSelector({ lang, dict }: QuizModeSelectorProps) {
  const d = dict.quiz
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {modes.map((m) => (
        <div key={m.key} className="flex flex-col rounded-xl border bg-white p-6 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
          <div className="text-3xl mb-3">{m.emoji}</div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
            {d[`mode_${m.key}` as keyof typeof d] as string}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
            {d[`mode_${m.key}_desc` as keyof typeof d] as string}
          </p>
          <Link
            href={`/${lang}/quiz/${m.key}`}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {d.start}
          </Link>
        </div>
      ))}
    </div>
  )
}
