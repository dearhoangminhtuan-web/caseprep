'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Dictionary } from '@/lib/i18n'

export default function FactSearch({ dict, categories }: { dict: Dictionary; categories: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const d = dict.facts

  const currentQ = searchParams.get('q') || ''
  const currentCategory = searchParams.get('category') || ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        placeholder={d.search_placeholder}
        defaultValue={currentQ}
        onChange={(e) => update('q', e.target.value)}
        className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => update('category', '')}
          className={[
            'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            !currentCategory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          ].join(' ')}
        >
          {d.category_all}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => update('category', cat)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize',
              currentCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            ].join(' ')}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}
