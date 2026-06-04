import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import FactSearch from './FactSearch'
import type { Lang, Fact } from '@/types'

export default async function FactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { lang: rawLang } = await params
  const { q, category } = await searchParams
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.facts

  const supabase = await createServerSupabaseClient()
  let query = supabase.from('facts').select('*')
  if (q) {
    const term = `%${q}%`
    query = query.or(`label_en.ilike.${term},label_ja.ilike.${term},value_text.ilike.${term},category.ilike.${term}`)
  }
  if (category) query = query.eq('category', category)
  const { data: facts } = await query.order('category').order('label_en')

  // Get distinct categories
  const { data: allFacts } = await supabase.from('facts').select('category')
  const categories = [...new Set(allFacts?.map(f => f.category).filter(Boolean))]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{d.subtitle}</p>
      </div>

      <Suspense>
        <FactSearch dict={dict} categories={categories as string[]} />
      </Suspense>

      {facts?.length === 0 ? (
        <p className="text-slate-500 text-center py-8">{d.no_results}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts?.map((f) => {
            const label = lang === 'ja' ? f.label_ja || f.label_en : f.label_en
            return (
              <div key={f.id} className="rounded-xl border bg-white p-4 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                  {f.category && (
                    <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {f.category.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">{f.value_text}</p>
                {f.unit && <p className="text-xs text-slate-400">{f.unit}</p>}
                {f.source_note && (
                  <p className="mt-2 text-xs text-slate-400 italic">{d.source}: {f.source_note}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
