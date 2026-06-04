'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { touchStreak } from './streak'
import { xpForCase, levelFromXp } from '@/lib/xp'
import type { Difficulty } from '@/types'

interface AttemptInput {
  caseId: string
  difficulty: Difficulty
  selfRating: number
  timeSpentSec: number
  completed: boolean
}

export async function saveCaseAttempt(input: AttemptInput) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already completed (no XP farming)
  const { data: existing } = await supabase
    .from('case_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('case_id', input.caseId)
    .eq('completed', true)
    .limit(1)
    .single()

  const xpAwarded = existing ? 0 : (input.completed ? xpForCase(input.difficulty) : Math.floor(xpForCase(input.difficulty) * 0.3))

  await supabase.from('case_attempts').insert({
    user_id: user.id,
    case_id: input.caseId,
    completed: input.completed,
    self_rating: input.selfRating,
    time_spent_sec: input.timeSpentSec,
    xp_awarded: xpAwarded,
  })

  if (xpAwarded > 0) {
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
  }

  await touchStreak(user.id)

  return { xpAwarded }
}
