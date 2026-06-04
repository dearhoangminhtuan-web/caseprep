import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import Badge from '@/components/ui/Badge'
import type { Lang, Framework } from '@/types'

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang: rawLang, id } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.frameworks

  const supabase = await createServerSupabaseClient()
  const { data: f } = await supabase
    .from('frameworks')
    .select('*')
    .eq('id', id)
    .single()

  if (!f) notFound()

  const fw = f as Framework
  const name = lang === 'ja' ? fw.name_ja || fw.name_en : fw.name_en
  const whenToUse = lang === 'ja' ? fw.when_to_use_ja || fw.when_to_use_en : fw.when_to_use_en
  const body = lang === 'ja' ? fw.body_ja || fw.body_en : fw.body_en
  const isPending = lang === 'ja' && !fw.body_ja

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        href={`/${lang}/frameworks`}
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        ← {d.back}
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl">
            {fw.category === 'profitability' ? '📊' :
             fw.category === 'market_entry' ? '🚀' :
             fw.category === 'strategy' ? '🗺️' :
             fw.category === 'marketing' ? '📣' :
             fw.category === 'ma' ? '🤝' : '📋'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h1>
            {isPending && (
              <span className="text-xs text-amber-600 dark:text-amber-400">⚠️ Japanese translation pending</span>
            )}
          </div>
        </div>

        {fw.applicable_case_types && fw.applicable_case_types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">{d.applies_to}:</span>
            {fw.applicable_case_types.map((t) => (
              <Badge key={t} variant="type" className="text-xs">
                {dict.cases[`type_${t}` as keyof typeof dict.cases] as string || t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* When to use */}
      <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5">
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-2">
          💡 {d.when_to_use}
        </h2>
        <p className="text-amber-900 dark:text-amber-200 leading-relaxed">{whenToUse}</p>
      </div>

      {/* Body */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  )
}
