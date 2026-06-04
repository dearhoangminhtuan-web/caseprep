import type { Difficulty } from '@/types'

export const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 99999]

export const LEVEL_LABELS = [
  '', 'Newcomer', 'Analyst', 'Consultant', 'Senior Consultant',
  'Manager', 'Senior Manager', 'Principal', 'Partner', 'Senior Partner', 'Master'
]

export function levelFromXp(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return Math.min(i + 1, 10)
  }
  return 1
}

export function xpForLevel(level: number): number {
  return XP_THRESHOLDS[Math.max(0, level - 1)] ?? 0
}

export function xpToNextLevel(xp: number): number {
  const level = levelFromXp(xp)
  if (level >= 10) return 0
  return XP_THRESHOLDS[level] - xp
}

export function progressPercent(xp: number): number {
  const level = levelFromXp(xp)
  if (level >= 10) return 100
  const start = XP_THRESHOLDS[level - 1]
  const end = XP_THRESHOLDS[level]
  return Math.round(((xp - start) / (end - start)) * 100)
}

export function xpForCase(difficulty: Difficulty): number {
  if (difficulty === 'easy') return 30
  if (difficulty === 'medium') return 60
  return 100
}

export function xpForQuiz(correct: number, total: number): number {
  const ratio = correct / total
  if (ratio >= 0.9) return 30
  if (ratio >= 0.7) return 20
  if (ratio >= 0.5) return 10
  return 5
}
