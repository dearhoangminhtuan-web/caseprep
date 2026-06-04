import { LEVEL_LABELS } from '@/lib/xp'

const levelColors = [
  '', 'text-slate-600', 'text-slate-500', 'text-blue-600', 'text-blue-700',
  'text-violet-600', 'text-violet-700', 'text-amber-600', 'text-amber-500',
  'text-rose-600', 'text-rose-500'
]
const ringColors = [
  '', 'ring-slate-300', 'ring-slate-400', 'ring-blue-400', 'ring-blue-500',
  'ring-violet-400', 'ring-violet-500', 'ring-amber-400', 'ring-amber-500',
  'ring-rose-400', 'ring-rose-500'
]

interface LevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function LevelBadge({ level, size = 'md', showLabel = false }: LevelBadgeProps) {
  const l = Math.min(10, Math.max(1, level))
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={[
        'flex items-center justify-center rounded-full ring-2 font-bold',
        sizeClasses[size],
        levelColors[l],
        ringColors[l],
        'bg-white dark:bg-slate-800',
      ].join(' ')}>
        {l}
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 dark:text-slate-400">{LEVEL_LABELS[l]}</span>
      )}
    </div>
  )
}
