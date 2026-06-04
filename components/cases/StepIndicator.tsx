const STEP_ORDER = ['prompt', 'clarify', 'structure', 'analysis', 'recommendation', 'debrief', 'model_answer']

interface StepIndicatorProps {
  currentStep: string
  labels: Record<string, string>
}

export default function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEP_ORDER.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={[
              'flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors',
              isCurrent ? 'bg-indigo-600 text-white' : isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
            ].join(' ')}>
              {isDone ? '✓ ' : ''}{labels[step] || step}
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className={`h-px w-3 ${isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
