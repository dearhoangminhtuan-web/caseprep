import ProgressBar from '@/components/ui/ProgressBar'
import { progressPercent, xpToNextLevel, levelFromXp } from '@/lib/xp'

interface XpBarProps {
  totalXp: number
  toNextLabel?: string
}

export default function XpBar({ totalXp, toNextLabel = 'to next level' }: XpBarProps) {
  const level = levelFromXp(totalXp)
  const pct = progressPercent(totalXp)
  const toNext = xpToNextLevel(totalXp)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{totalXp} XP</span>
        {level < 10 && <span>{toNext} {toNextLabel}</span>}
      </div>
      <ProgressBar value={pct} color="indigo" />
    </div>
  )
}
