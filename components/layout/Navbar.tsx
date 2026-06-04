'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LangSwitcher from './LangSwitcher'
import LevelBadge from '@/components/gamification/LevelBadge'
import type { Dictionary } from '@/lib/i18n'
import type { Lang, UserStats } from '@/types'
import { logout } from '@/lib/actions/auth'

interface NavbarProps {
  lang: Lang
  dict: Dictionary
  userStats?: UserStats | null
  displayName?: string | null
}

export default function Navbar({ lang, dict, userStats, displayName }: NavbarProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: `/${lang}/dashboard`, label: dict.nav.dashboard },
    { href: `/${lang}/cases`, label: dict.nav.cases },
    { href: `/${lang}/frameworks`, label: dict.nav.frameworks },
    { href: `/${lang}/facts`, label: dict.nav.facts },
    { href: `/${lang}/quiz`, label: dict.nav.quiz },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-700">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href={`/${lang}`} className="flex items-center gap-2 font-bold text-indigo-600 text-lg shrink-0">
          <span className="text-2xl">🥋</span>
          Case Dojo
        </Link>

        {/* Nav links (desktop) */}
        {userStats && (
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          <LangSwitcher current={lang} />

          {userStats ? (
            <div className="flex items-center gap-3">
              {/* XP + Level mini display */}
              <div className="hidden sm:flex items-center gap-2">
                <LevelBadge level={userStats.level} size="sm" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {userStats.total_xp} XP
                </span>
                <span className="text-xs">🔥 {userStats.streak}</span>
              </div>

              {/* User menu */}
              <form action={() => logout(lang)}>
                <button
                  type="submit"
                  className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {dict.nav.logout}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${lang}/login`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {dict.nav.login}
              </Link>
              <Link
                href={`/${lang}/signup`}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                {dict.nav.signup}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {userStats && (
        <nav className="flex md:hidden overflow-x-auto border-t dark:border-slate-700 px-4 gap-1 pb-2 pt-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                pathname.startsWith(link.href)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
