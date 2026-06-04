import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import CaseCard from '@/components/cases/CaseCard'
import CaseFilterBar from '@/components/cases/CaseFilterBar'
import type { Lang, Case } from '@/types'

export default async function CasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ type?: string; difficulty?: string }>
}) {
  const { lang: rawLang } = await params
  const { type, difficulty } = await searchParams
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.cases

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('cases').select('*').eq('is_published', true)
  if (type) query = query.eq('type', type)
  if (difficulty) query = query.eq('difficulty', difficulty)
  const { data: cases } = await query.order('difficulty').order('created_at')

  // Get completed case IDs for this user
  const { data: attempts } = await supabase
    .from('case_attempts')
    .select('case_id')
    .eq('user_id', user!.id)
    .eq('completed', true)
  const completedIds = new Set(attempts?.map(a => a.case_id) ?? [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{d.subtitle}</p>
      </div>

      <Suspense>
        <CaseFilterBar dict={dict} />
      </Suspense>

      {cases?.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 py-8 text-center">{d.no_cases}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases?.map((c) => (
            <CaseCard
              key={c.id}
              case_={c as Case}
              lang={lang}
              dict={dict}
              completed={completedIds.has(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
