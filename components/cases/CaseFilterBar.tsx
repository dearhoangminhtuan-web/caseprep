'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n'

export default function CaseFilterBar({ dict }: { dict: Dictionary }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const d = dict.cases

  const currentType = searchParams.get('type') || ''
  const currentDifficulty = searchParams.get('difficulty') || ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const types = [
    { value: '', label: d.filter_all },
    { value: 'profitability', label: d.type_profitability },
    { value: 'market_entry', label: d.type_market_entry },
    { value: 'market_sizing', label: d.type_market_sizing },
    { value: 'ma', label: d.type_ma },
    { value: 'operations', label: d.type_operations },
  ]

  const difficulties = [
    { value: '', label: d.filter_all },
    { value: 'easy', label: d.difficulty_easy },
    { value: 'medium', label: d.difficulty_medium },
    { value: 'professional', label: d.difficulty_professional },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{d.filter_type}</label>
        <div className="flex flex-wrap gap-1">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => update('type', t.value)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                currentType === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{d.filter_difficulty}</label>
        <div className="flex flex-wrap gap-1">
          {difficulties.map((d_) => (
            <button
              key={d_.value}
              onClick={() => update('difficulty', d_.value)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                currentDifficulty === d_.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
              ].join(' ')}
            >
              {d_.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
