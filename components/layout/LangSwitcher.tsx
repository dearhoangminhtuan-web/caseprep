'use client'
import { useRouter, usePathname } from 'next/navigation'
import type { Lang } from '@/types'

export default function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter()
  const pathname = usePathname()

  async function switchLang(lang: Lang) {
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang }),
    })
    // Replace /en/... with /ja/... or vice versa
    const newPath = pathname.replace(/^\/(en|ja)/, `/${lang}`)
    router.push(newPath)
    router.refresh()
  }

  return (
    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
      {(['en', 'ja'] as Lang[]).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className={[
            'px-3 py-1.5 font-medium transition-colors',
            current === lang
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
          ].join(' ')}
        >
          {lang === 'en' ? 'EN' : '日本語'}
        </button>
      ))}
    </div>
  )
}
