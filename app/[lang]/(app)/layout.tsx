import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { UserStatsProvider } from '@/components/providers/UserStatsProvider'
import type { Lang } from '@/types'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${lang}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('level, total_xp, streak, last_active_date')
    .eq('id', user.id)
    .single()

  const stats = profile ?? { level: 1, total_xp: 0, streak: 0, last_active_date: null }

  return (
    <UserStatsProvider initial={stats}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </div>
    </UserStatsProvider>
  )
}
