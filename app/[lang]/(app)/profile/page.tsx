import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { updateProfile } from '@/lib/actions/profile'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { LEVEL_LABELS } from '@/lib/xp'
import type { Lang } from '@/types'

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.profile

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: caseStats } = await supabase
    .from('case_attempts')
    .select('completed, xp_awarded')
    .eq('user_id', user!.id)

  const { data: quizStats } = await supabase
    .from('quiz_results')
    .select('score, total')
    .eq('user_id', user!.id)

  const completedCases = caseStats?.filter(a => a.completed).length ?? 0
  const totalXp = profile?.total_xp ?? 0
  const level = profile?.level ?? 1

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>

      {/* Stats */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{d.stats_title}</h2>
        <div className="flex flex-wrap items-center gap-6">
          <LevelBadge level={level} size="lg" showLabel />
          <div className="flex-1 min-w-[200px]">
            <XpBar totalXp={totalXp} toNextLabel={dict.gamification.next_level} />
          </div>
          <StreakCounter streak={profile?.streak ?? 0} label={dict.gamification.streak} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">{dict.dashboard.cases_done}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedCases}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{dict.dashboard.quizzes_done}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{quizStats?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{d.title}</h2>
        <form action={async (formData: FormData) => { await updateProfile(formData) }} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">{d.email}</label>
            <input
              value={user!.email ?? ''}
              disabled
              className="h-10 w-full rounded-lg border bg-slate-50 px-3 text-sm text-slate-500 dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <Input
            label={d.display_name}
            name="display_name"
            defaultValue={profile?.display_name ?? ''}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.lang_pref}</label>
            <select
              name="lang_pref"
              defaultValue={profile?.lang_pref ?? lang}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          <Button type="submit" className="w-full sm:w-auto">{d.save}</Button>
        </form>
      </div>
    </div>
  )
}
