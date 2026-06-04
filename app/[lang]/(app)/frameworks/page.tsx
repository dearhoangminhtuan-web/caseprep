import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDictionary, hasLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import FrameworkCard from '@/components/frameworks/FrameworkCard'
import type { Lang, Framework } from '@/types'

export default async function FrameworksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params
  const lang: Lang = hasLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const dict = await getDictionary(lang)
  const d = dict.frameworks

  const supabase = await createServerSupabaseClient()
  const { data: frameworks } = await supabase
    .from('frameworks')
    .select('*')
    .order('sort_order')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{d.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{d.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {frameworks?.map((f) => (
          <FrameworkCard key={f.id} framework={f as Framework} lang={lang} dict={dict} />
        ))}
      </div>
    </div>
  )
}
