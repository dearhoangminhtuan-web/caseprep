export type Lang = 'en' | 'ja'
export type CaseType = 'profitability' | 'market_entry' | 'market_sizing' | 'ma' | 'operations'
export type Difficulty = 'easy' | 'medium' | 'professional'
export type QuizMode = 'math' | 'framework' | 'fact'
export type CaseStep = 'prompt' | 'clarify' | 'structure' | 'analysis' | 'recommendation' | 'debrief' | 'model_answer'

export interface Profile {
  id: string
  display_name: string | null
  lang_pref: Lang
  total_xp: number
  level: number
  streak: number
  last_active_date: string | null
  created_at: string
}

export interface Case {
  id: string
  slug: string
  type: CaseType
  difficulty: Difficulty
  source_label: 'Original' | 'AI-generated' | 'Adapted'
  source_url: string | null
  title_en: string
  title_ja: string | null
  summary_en: string
  summary_ja: string | null
  steps_en: Record<CaseStep, string>
  steps_ja: Record<CaseStep, string> | null
  xp_value: number
  is_published: boolean
  created_at: string
}

export interface Framework {
  id: string
  slug: string
  name_en: string
  name_ja: string | null
  category: string | null
  when_to_use_en: string
  when_to_use_ja: string | null
  body_en: string
  body_ja: string | null
  diagram_url: string | null
  applicable_case_types: CaseType[] | null
  sort_order: number
  created_at: string
}

export interface Fact {
  id: string
  label_en: string
  label_ja: string | null
  value_text: string
  numeric_value: number | null
  unit: string | null
  category: string | null
  source_note: string | null
  body_en: string | null
  body_ja: string | null
  created_at: string
}

export interface CaseAttempt {
  id: string
  user_id: string
  case_id: string
  completed: boolean
  self_rating: number | null
  time_spent_sec: number | null
  xp_awarded: number
  created_at: string
}

export interface QuizResult {
  id: string
  user_id: string
  mode: QuizMode
  score: number
  total: number
  xp_awarded: number
  created_at: string
}

export interface UserStats {
  level: number
  total_xp: number
  streak: number
  last_active_date: string | null
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation?: string
}
