'use client'
import { useState, useEffect, useRef } from 'react'
import StepIndicator from './StepIndicator'
import Button from '@/components/ui/Button'
import { saveCaseAttempt } from '@/lib/actions/cases'
import { useUserStats } from '@/components/providers/UserStatsProvider'
import type { Case, Lang, CaseStep } from '@/types'
import type { Dictionary } from '@/lib/i18n'

const STEP_ORDER: CaseStep[] = ['prompt', 'clarify', 'structure', 'analysis', 'recommendation', 'debrief', 'model_answer']

interface CasePlayerProps {
  case_: Case
  lang: Lang
  dict: Dictionary
  alreadyCompleted: boolean
}

export default function CasePlayer({ case_: c, lang, dict, alreadyCompleted }: CasePlayerProps) {
  const d = dict.cases
  const [stepIndex, setStepIndex] = useState(0)
  const [selfRating, setSelfRating] = useState(3)
  const [showModel, setShowModel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | null>(null)
  const startTime = useRef(Date.now())
  const { addXp } = useUserStats()

  const steps = lang === 'ja' && c.steps_ja ? c.steps_ja : c.steps_en
  const currentStep = STEP_ORDER[stepIndex]
  const isLast = stepIndex === STEP_ORDER.length - 1
  const isDebrief = currentStep === 'debrief'
  const isModelAnswer = currentStep === 'model_answer'

  const stepLabels: Record<string, string> = {
    prompt: d.steps.prompt,
    clarify: d.steps.clarify,
    structure: d.steps.structure,
    analysis: d.steps.analysis,
    recommendation: d.steps.recommendation,
    debrief: d.steps.debrief,
    model_answer: d.steps.model_answer,
  }

  async function handleFinish() {
    setSubmitting(true)
    const timeSpentSec = Math.round((Date.now() - startTime.current) / 1000)
    const result = await saveCaseAttempt({
      caseId: c.id,
      difficulty: c.difficulty,
      selfRating,
      timeSpentSec,
      completed: true,
    })
    if (result && 'xpAwarded' in result && result.xpAwarded != null) {
      setXpEarned(result.xpAwarded)
      if (result.xpAwarded > 0) addXp(result.xpAwarded)
    }
    setSubmitting(false)
    setShowModel(true)
  }

  const title = lang === 'ja' ? c.title_ja || c.title_en : c.title_en

  if (showModel) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{d.case_complete}</h2>
          {xpEarned !== null && xpEarned > 0 && (
            <p className="mt-1 text-emerald-700 dark:text-emerald-300 font-medium">+{xpEarned} {d.xp_earned}</p>
          )}
          {alreadyCompleted && (
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">(Review attempt — no XP for repeat)</p>
          )}
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{d.steps.model_answer}</h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{steps.model_answer}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h1>
        <StepIndicator currentStep={currentStep} labels={stepLabels} />
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6 min-h-48">
        <h2 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
          {stepLabels[currentStep]}
        </h2>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {steps[currentStep]}
        </p>
      </div>

      {/* Self rating on debrief */}
      {isDebrief && (
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-5">
          <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">{d.rate_yourself}</p>
          <p className="text-xs text-slate-500 mb-3">{d.rate_hint}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSelfRating(n)}
                className={[
                  'w-10 h-10 rounded-lg border text-sm font-bold transition-colors',
                  selfRating === n
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setStepIndex(i => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          {d.prev_step}
        </Button>

        {isDebrief ? (
          <Button onClick={handleFinish} loading={submitting}>
            {d.finish}
          </Button>
        ) : (
          <Button onClick={() => setStepIndex(i => Math.min(STEP_ORDER.length - 1, i + 1))}>
            {d.next_step}
          </Button>
        )}
      </div>
    </div>
  )
}
