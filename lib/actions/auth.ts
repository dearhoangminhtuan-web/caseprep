'use server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE } from '@/lib/i18n'

function getLang() {
  // Best-effort — not critical
  return DEFAULT_LOCALE
}

export async function signupWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const display_name = formData.get('display_name') as string
  const lang_pref = (formData.get('lang_pref') as string) || DEFAULT_LOCALE

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: display_name },
      emailRedirectTo: `${origin}/${lang_pref}/callback`,
    },
  })

  if (error) return { error: error.message }

  // Set lang cookie
  const cookieStore = await cookies()
  cookieStore.set('lang', lang_pref, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  redirect(`/${lang_pref}/dashboard`)
}

export async function loginWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || DEFAULT_LOCALE
  redirect(`/${lang}/dashboard`)
}

export async function loginWithGoogle(lang: string) {
  const supabase = await createServerSupabaseClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/${lang}/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function logout(lang: string) {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect(`/${lang}/login`)
}
