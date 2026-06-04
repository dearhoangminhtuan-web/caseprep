import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import CasePlayer from '@/components/cases/CasePlayer'
import Badge from '@/components/ui/Badge'
import type { Lang, Case, Difficulty } from '@/types'

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang: rawLang, id } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.cases

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: case_ } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!case_) notFound()

  const { data: attempt } = await supabase
    .from('case_attempts')
    .select('id')
    .eq('user_id', user!.id)
    .eq('case_id', id)
    .eq('completed', true)
    .limit(1)
    .single()

  const alreadyCompleted = !!attempt

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/${lang}/cases`}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          ← {d.back_to_library}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="difficulty" difficulty={case_.difficulty as Difficulty}>
          {d[`difficulty_${case_.difficulty}` as keyof typeof d] as string}
        </Badge>
        <Badge variant="type">
          {d[`type_${case_.type}` as keyof typeof d] as string}
        </Badge>
        <Badge variant="source">{case_.source_label}</Badge>
        <span className="text-xs text-slate-400 ml-auto">{case_.xp_value} {d.xp_reward}</span>
      </div>

      <CasePlayer
        case_={case_ as Case}
        lang={lang}
        dict={dict}
        alreadyCompleted={alreadyCompleted}
      />
    </div>
  )
}
