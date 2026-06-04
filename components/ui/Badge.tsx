import type { CaseType, Difficulty } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'difficulty' | 'type' | 'source' | 'default'
  difficulty?: Difficulty
  className?: string
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  professional: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export default function Badge({ children, variant = 'default', difficulty, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

  if (variant === 'difficulty' && difficulty) {
    return <span className={`${base} ${difficultyColors[difficulty]} ${className}`}>{children}</span>
  }

  if (variant === 'type') {
    return <span className={`${base} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 ${className}`}>{children}</span>
  }

  if (variant === 'source') {
    return <span className={`${base} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 ${className}`}>{children}</span>
  }

  return <span className={`${base} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 ${className}`}>{children}</span>
}
