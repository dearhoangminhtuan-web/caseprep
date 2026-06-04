'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Lang } from '@/types'

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const display_name = formData.get('display_name') as string
  const lang_pref = formData.get('lang_pref') as Lang

  await supabase
    .from('profiles')
    .update({ display_name, lang_pref })
    .eq('id', user.id)

  const cookieStore = await cookies()
  cookieStore.set('lang', lang_pref, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  return { ok: true }
}

export async function deleteAccount(lang: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.auth.admin.deleteUser(user.id).catch(() => {
    // Fallback: sign out
    supabase.auth.signOut()
  })

  redirect(`/${lang}`)
}
