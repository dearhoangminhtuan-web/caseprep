'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function touchStreak(userId: string) {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak, last_active_date')
    .eq('id', userId)
    .single()

  if (!profile) return

  const last = profile.last_active_date
  let newStreak = profile.streak

  if (!last) {
    newStreak = 1
  } else if (last === today) {
    return // already active today
  } else {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    newStreak = last === yesterdayStr ? profile.streak + 1 : 1
  }

  await supabase
    .from('profiles')
    .update({ streak: newStreak, last_active_date: today })
    .eq('id', userId)
}
