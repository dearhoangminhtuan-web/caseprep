'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { touchStreak } from './streak'
import { xpForQuiz, levelFromXp } from '@/lib/xp'
import type { QuizMode } from '@/types'

export async function submitQuizResult(input: {
  mode: QuizMode
  score: number
  total: number
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const xpAwarded = xpForQuiz(input.score, input.total)

  await supabase.from('quiz_results').insert({
    user_id: user.id,
    mode: input.mode,
    score: input.score,
    total: input.total,
    xp_awarded: xpAwarded,
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', user.id)
    .single()

  if (profile) {
    const newXp = profile.total_xp + xpAwarded
    const newLevel = levelFromXp(newXp)
    await supabase
      .from('profiles')
      .update({ total_xp: newXp, level: newLevel })
      .eq('id', user.id)
  }

  await touchStreak(user.id)

  return { xpAwarded }
}
