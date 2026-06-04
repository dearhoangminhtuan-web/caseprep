import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { Framework, Lang, CaseType } from '@/types'
import type { Dictionary } from '@/lib/i18n'

interface FrameworkCardProps {
  framework: Framework
  lang: Lang
  dict: Dictionary
}

export default function FrameworkCard({ framework: f, lang, dict }: FrameworkCardProps) {
  const name = lang === 'ja' ? f.name_ja || f.name_en : f.name_en
  const whenToUse = lang === 'ja' ? f.when_to_use_ja || f.when_to_use_en : f.when_to_use_en

  return (
    <Link href={`/${lang}/frameworks/${f.id}`}>
      <div className="flex flex-col rounded-xl border bg-white p-5 hover:shadow-md transition-all cursor-pointer h-full dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xl">
            {f.category === 'profitability' ? '📊' :
             f.category === 'market_entry' ? '🚀' :
             f.category === 'strategy' ? '🗺️' :
             f.category === 'marketing' ? '📣' :
             f.category === 'ma' ? '🤝' : '📋'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">{name}</h3>
            {f.category && (
              <Badge variant="type" className="mt-1 capitalize">{f.category}</Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
          {whenToUse}
        </p>
        {f.applicable_case_types && f.applicable_case_types.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {f.applicable_case_types.slice(0, 2).map((t) => (
              <Badge key={t} variant="source" className="text-xs">
                {dict.cases[`type_${t}` as keyof typeof dict.cases] as string || t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
