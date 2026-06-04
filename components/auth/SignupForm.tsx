'use client'
import { useActionState } from 'react'
import { signupWithEmail } from '@/lib/actions/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Dictionary } from '@/lib/i18n'
import type { Lang } from '@/types'

export default function SignupForm({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const d = dict.auth
  const [error, action, pending] = useActionState<string | null, FormData>(
    async (_prev, formData) => {
      const result = await signupWithEmail(formData)
      return result?.error ?? null
    },
    null
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label={d.name} name="display_name" required autoComplete="name" />
      <Input label={d.email} name="email" type="email" required autoComplete="email" />
      <Input label={d.password} name="password" type="password" required autoComplete="new-password" minLength={6} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.lang_pref}</label>
        <select
          name="lang_pref"
          defaultValue={lang}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">{d.error_generic}</p>}
      <Button type="submit" loading={pending} className="w-full">{d.signup_btn}</Button>
    </form>
  )
}
