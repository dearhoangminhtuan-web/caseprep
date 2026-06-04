'use client'
import { useState } from 'react'
import Link from 'next/link'
import { submitQuizResult } from '@/lib/actions/quiz'
import { useUserStats } from '@/components/providers/UserStatsProvider'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import type { QuizQuestion, QuizMode, Lang } from '@/types'
import type { Dictionary } from '@/lib/i18n'

interface QuizRunnerProps {
  questions: QuizQuestion[]
  mode: QuizMode
  lang: Lang
  dict: Dictionary
}

type Phase = 'question' | 'answered' | 'results'

export default function QuizRunner({ questions, mode, lang, dict }: QuizRunnerProps) {
  const d = dict.quiz
  const [phase, setPhase] = useState<Phase>('question')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | null>(null)
  const { addXp } = useUserStats()

  const current = questions[currentIndex]
  const total = questions.length
  const progress = Math.round((currentIndex / total) * 100)

  function handleSelect(i: number) {
    if (phase !== 'question') return
    setSelectedOption(i)
    setPhase('answered')
    if (i === current.correct_index) setCorrect(c => c + 1)
  }

  async function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1)
      setSelectedOption(null)
      setPhase('question')
    } else {
      // Final
      setSubmitting(true)
      const finalCorrect = correct + (selectedOption != null && selectedOption === current.correct_index ? 1 : 0)
      const result = await submitQuizResult({ mode, score: finalCorrect, total })
      if (result && 'xpAwarded' in result && result.xpAwarded != null) {
        setXpEarned(result.xpAwarded)
        if (result.xpAwarded > 0) addXp(result.xpAwarded)
      }
      setSubmitting(false)
      setPhase('results')
    }
  }

  if (phase === 'results') {
    const finalScore = correct  // already incremented during handleSelect
    const pct = Math.round((finalScore / total) * 100)
    return (
      <div className="flex flex-col items-center gap-6 py-8 max-w-lg mx-auto">
        <div className="text-5xl">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{d.results_title}</h2>
        <div className="w-full rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6 text-center">
          <p className="text-4xl font-bold text-indigo-600 mb-1">{finalScore}/{total}</p>
          <p className="text-slate-500 dark:text-slate-400">{pct}% {d.score}</p>
          {xpEarned !== null && xpEarned > 0 && (
            <p className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">+{xpEarned} {d.xp_earned}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link href={`/${lang}/quiz`}>
            <Button variant="secondary">{d.back}</Button>
          </Link>
          <Link href={`/${lang}/quiz/${mode}`}>
            <Button>{d.retry}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{d.question_of.replace('{n}', String(currentIndex + 1)).replace('{total}', String(total))}</span>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
        <p className="text-slate-900 dark:text-white font-medium leading-relaxed text-lg">
          {current.question}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {current.options.map((opt, i) => {
          const isSelected = selectedOption === i
          const isCorrect = i === current.correct_index
          const showFeedback = phase === 'answered'

          let cls = 'rounded-xl border p-4 text-left text-sm font-medium transition-colors w-full cursor-pointer'
          if (!showFeedback) {
            cls += isSelected
              ? ' bg-indigo-600 text-white border-indigo-600'
              : ' bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          } else {
            if (isCorrect) cls += ' bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
            else if (isSelected) cls += ' bg-red-50 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            else cls += ' bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-400 cursor-default'
          }

          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={phase === 'answered'}>
              <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {phase === 'answered' && (
        <div className="rounded-xl border p-4 dark:border-slate-700">
          <p className={`font-semibold ${selectedOption === current.correct_index ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {selectedOption === current.correct_index ? `✓ ${d.correct}` : `✗ ${d.incorrect}`}
          </p>
          {current.explanation && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.explanation}: {current.explanation}</p>
          )}
          <div className="mt-3 flex justify-end">
            <Button onClick={handleNext} loading={submitting}>
              {currentIndex < total - 1 ? d.next : d.finish}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
