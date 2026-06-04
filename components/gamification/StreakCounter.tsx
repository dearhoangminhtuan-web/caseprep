interface StreakCounterProps {
  streak: number
  label?: string
}

export default function StreakCounter({ streak, label = 'Day Streak' }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xl ${streak > 0 ? 'animate-none' : 'opacity-40'}`}>🔥</span>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{streak}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </div>
  )
}
