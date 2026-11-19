'use client'

import { useEffect, useState } from 'react'
import { API_BASE } from '@/components/spendwise/api'
import { AuthScreen, type SpendWiseUser } from '@/components/spendwise/AuthScreen'
import { BudgetsView } from '@/components/spendwise/BudgetsView'
import type { ExpenseEntry, MonthlyBudget } from '@/components/spendwise/types'

export default function BudgetsPage() {
  const [user, setUser] = useState<SpendWiseUser | null>(null)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('spendwise_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('spendwise_user')
      }
    }
    setCheckedAuth(true)
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/api/spendwise/dashboard?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(
          (data.entries ?? []).map((e: any) => ({
            id: String(e.id),
            date: e.date,
            category: e.category,
            amount: Number(e.amount),
          })),
        )
        setBudgets(
          (data.budgets ?? []).map((b: any) => ({
            id: String(b.id),
            monthKey: b.monthKey,
            totalBudget: Number(b.totalBudget),
            food: Number(b.food),
            transport: Number(b.transport),
            shopping: Number(b.shopping),
            bills: Number(b.bills),
            entertainment: Number(b.entertainment),
            other: Number(b.other),
          })),
        )
      })
      .catch(console.error)
  }, [user])

  if (!checkedAuth) return null
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return <BudgetsView entries={entries} initialBudgets={budgets} />
}
