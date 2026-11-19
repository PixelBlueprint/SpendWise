import 'server-only'

import type { ExpenseEntry, MonthlyBudget } from '@/components/spendwise/types'

const API_BASE = 'http://localhost:8080/api/spendwise'

export async function getSpendWiseData(): Promise<{
  entries: ExpenseEntry[]
  budgets: MonthlyBudget[]
}> {
  const res = await fetch(`${API_BASE}/dashboard`, {
    cache: 'no-store', // Always fetch fresh data from PostgreSQL
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch SpendWise data: ${res.status}`)
  }

  const data = await res.json()

  return {
    entries: (data.entries ?? []).map((entry: any) => ({
      id: String(entry.id),
      date: entry.date,
      category: entry.category,
      amount: Number(entry.amount),
    })),
    budgets: (data.budgets ?? []).map((budget: any) => ({
      id: String(budget.id),
      monthKey: budget.monthKey,
      totalBudget: Number(budget.totalBudget),
      food: Number(budget.food),
      transport: Number(budget.transport),
      shopping: Number(budget.shopping),
      bills: Number(budget.bills),
      entertainment: Number(budget.entertainment),
      other: Number(budget.other),
    })),
  }
}
