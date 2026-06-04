import type { Metadata } from 'next'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { Lang } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return {
    title: lang === 'ja' ? 'Case Dojo — ケース面接対策' : 'Case Dojo — Master Case Interviews',
    description: lang === 'ja'
      ? 'MBBコンサルティング面接対策のためのバイリンガル学習アプリ'
      : 'Bilingual gamified consulting case interview prep for MBB',
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userStats = null
  let displayName = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('level, total_xp, streak, last_active_date, display_name')
      .eq('id', user.id)
      .single()

    if (profile) {
      userStats = {
        level: profile.level,
        total_xp: profile.total_xp,
        streak: profile.streak,
        last_active_date: profile.last_active_date,
      }
      displayName = profile.display_name
    }
  }

  return (
    <div className="flex min-h-screen flex-col" lang={lang}>
      <Navbar lang={lang} dict={dict} userStats={userStats} displayName={displayName} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
