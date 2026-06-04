'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserStats } from '@/types'

interface UserStatsContextValue {
  stats: UserStats
  addXp: (amount: number) => void
}

const UserStatsContext = createContext<UserStatsContextValue | null>(null)

export function UserStatsProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial: UserStats
}) {
  const [stats, setStats] = useState<UserStats>(initial)

  function addXp(amount: number) {
    setStats((s) => ({ ...s, total_xp: s.total_xp + amount }))
  }

  return (
    <UserStatsContext.Provider value={{ stats, addXp }}>
      {children}
    </UserStatsContext.Provider>
  )
}

export function useUserStats() {
  const ctx = useContext(UserStatsContext)
  if (!ctx) throw new Error('useUserStats must be used inside UserStatsProvider')
  return ctx
}
