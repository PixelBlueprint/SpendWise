'use client'

import { useEffect, useState } from 'react'
import { AuthScreen, type SpendWiseUser } from '@/components/spendwise/AuthScreen'
import { TransactionsView } from '@/components/spendwise/TransactionsView'
import type { ExpenseEntry } from '@/components/spendwise/types'

export default function TransactionsPage() {
  const [user, setUser] = useState<SpendWiseUser | null>(null)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [entries, setEntries] = useState<ExpenseEntry[]>([])

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
    fetch(`http://localhost:8080/api/spendwise/dashboard?userId=${user.id}`)
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
      })
      .catch(console.error)
  }, [user])

  if (!checkedAuth) return null
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return <TransactionsView initialEntries={entries} />
}
