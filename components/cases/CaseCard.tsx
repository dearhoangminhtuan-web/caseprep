import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { Case, Lang, Difficulty } from '@/types'
import type { Dictionary } from '@/lib/i18n'

interface CaseCardProps {
  case_: Case
  lang: Lang
  dict: Dictionary
  completed?: boolean
}

export default function CaseCard({ case_: c, lang, dict, completed = false }: CaseCardProps) {
  const d = dict.cases
  const title = lang === 'ja' ? c.title_ja || c.title_en : c.title_en
  const summary = lang === 'ja' ? c.summary_ja || c.summary_en : c.summary_en

  return (
    <div className="flex flex-col rounded-xl border bg-white p-5 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="difficulty" difficulty={c.difficulty as Difficulty}>
            {d[`difficulty_${c.difficulty}` as keyof typeof d] as string}
          </Badge>
          <Badge variant="type">
            {d[`type_${c.type}` as keyof typeof d] as string}
          </Badge>
        </div>
        {completed && <span className="text-emerald-500 text-lg">✓</span>}
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 mb-4">{summary}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{d.source_original === c.source_label ? d.source_original : c.source_label} · {c.xp_value} {d.xp_reward}</span>
        <Link
          href={`/${lang}/cases/${c.id}`}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {completed ? d.review : d.start}
        </Link>
      </div>
    </div>
  )
}
