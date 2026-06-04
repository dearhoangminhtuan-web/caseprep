import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { levelFromXp, xpToNextLevel, progressPercent, LEVEL_LABELS } from '@/lib/xp'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { Lang, Difficulty } from '@/types'

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.dashboard

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Stats
  const { data: attempts } = await supabase
    .from('case_attempts')
    .select('case_id, completed, xp_awarded, created_at, cases(type, difficulty, title_en, title_ja)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: quizResults } = await supabase
    .from('quiz_results')
    .select('score, total, mode, xp_awarded, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const completedCases = attempts?.filter(a => a.completed) ?? []
  const totalQuizzes = quizResults?.length ?? 0
  const avgAccuracy = quizResults?.length
    ? Math.round(quizResults.reduce((acc, r) => acc + (r.score / r.total), 0) / quizResults.length * 100)
    : 0

  // Recommend a case
  const { data: allCases } = await supabase
    .from('cases')
    .select('id, slug, title_en, title_ja, difficulty, type')
    .eq('is_published', true)
    .order('difficulty', { ascending: true })

  const completedCaseIds = new Set(completedCases.map(a => a.case_id))
  const recommended = allCases?.find(c => !completedCaseIds.has(c.id))

  const totalXp = profile?.total_xp ?? 0
  const level = profile?.level ?? 1
  const streak = profile?.streak ?? 0

  // Recent activity (last 5 unique events)
  const recentActivity = [
    ...(attempts?.slice(0, 3).map(a => ({
      type: 'case' as const,
      title: lang === 'ja' ? (a.cases as any)?.title_ja || (a.cases as any)?.title_en : (a.cases as any)?.title_en,
      xp: a.xp_awarded,
      date: a.created_at,
    })) ?? []),
    ...(quizResults?.slice(0, 2).map(r => ({
      type: 'quiz' as const,
      title: `${dict.quiz[`mode_${r.mode}` as keyof typeof dict.quiz] || r.mode} Quiz`,
      xp: r.xp_awarded,
      date: r.created_at,
    })) ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {d.welcome}, {profile?.display_name || user!.email?.split('@')[0]}!
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Level + XP */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <LevelBadge level={level} size="lg" showLabel />
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{d.xp_label}</p>
              <XpBar totalXp={totalXp} toNextLabel={d.xp_to_next} />
            </div>
          </div>
        </Card>

        {/* Streak */}
        <Card className="flex items-center justify-center">
          <StreakCounter streak={streak} label={d.streak_label} />
        </Card>

        {/* Quick stats */}
        <Card className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">{d.cases_done}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{completedCases.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">{d.quizzes_done}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{totalQuizzes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">{d.accuracy}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{avgAccuracy}%</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recommended case */}
        {recommended && (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">{d.recommended}</h2>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {lang === 'ja' ? recommended.title_ja || recommended.title_en : recommended.title_en}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="difficulty" difficulty={recommended.difficulty as Difficulty}>
                    {dict.cases[`difficulty_${recommended.difficulty}` as keyof typeof dict.cases] as string}
                  </Badge>
                  <Badge variant="type">
                    {dict.cases[`type_${recommended.type}` as keyof typeof dict.cases] as string}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/${lang}/cases/${recommended.id}`}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                {d.start_case}
              </Link>
            </div>
          </Card>
        )}

        {/* Recent activity */}
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">{d.recent_activity}</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{d.no_activity}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex items-center justify-between py-1 border-b last:border-0 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.type === 'case' ? '📚' : '⚡'}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{item.title}</span>
                  </div>
                  {item.xp > 0 && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+{item.xp} XP</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick action links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: `/${lang}/cases`, label: dict.nav.cases, emoji: '📚' },
          { href: `/${lang}/frameworks`, label: dict.nav.frameworks, emoji: '🗺️' },
          { href: `/${lang}/facts`, label: dict.nav.facts, emoji: '🔢' },
          { href: `/${lang}/quiz`, label: dict.nav.quiz, emoji: '⚡' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700"
          >
            <span className="text-2xl">{link.emoji}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
