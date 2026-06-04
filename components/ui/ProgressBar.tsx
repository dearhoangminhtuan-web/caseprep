interface ProgressBarProps {
  value: number // 0-100
  color?: 'indigo' | 'emerald' | 'amber'
  className?: string
  showLabel?: boolean
}

const colorClasses = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
}

export default function ProgressBar({ value, color = 'indigo', className = '', showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`relative ${className}`}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-slate-500">{clamped}%</span>
      )}
    </div>
  )
}
