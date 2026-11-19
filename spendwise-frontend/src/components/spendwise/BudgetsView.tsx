'use client'

import { API_BASE } from './api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import type { SpendWiseUser } from './AuthScreen'
import { Icon } from './Icon'
import {
  categories,
  currency,
  defaultBudget,
  localDateKey,
  monthKey as currentMonthKey,
  type CategoryKey,
  type ExpenseEntry,
  type MonthlyBudget,
} from './types'

export function BudgetsView({
  entries,
  initialBudgets,
}: {
  entries: ExpenseEntry[]
  initialBudgets: MonthlyBudget[]
}) {
  const router = useRouter()
  const todayStr = localDateKey()
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly')
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const existing = initialBudgets.find((item) => item.monthKey === monthKey)
  const [draft, setDraft] = useState<MonthlyBudget>(
    existing ?? { id: '', monthKey, ...defaultBudget },
  )
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [user, setUser] = useState<SpendWiseUser | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('spendwise_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('spendwise_user')
      }
    }
  }, [])

  useEffect(() => {
    const found = initialBudgets.find((item) => item.monthKey === monthKey)
    setDraft(found ?? { id: '', monthKey, ...defaultBudget })
  }, [initialBudgets, monthKey])

  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  // Calculate current day index & remaining days (including today) for compensation math
  const isCurrentMonth = todayStr.startsWith(monthKey)
  const isPastMonth = monthKey < todayStr.slice(0, 7)
  const elapsedDays = isCurrentMonth
    ? Math.max(1, Number(todayStr.slice(-2)))
    : isPastMonth
      ? daysInMonth
      : 1
  const remainingDays = isCurrentMonth
    ? Math.max(1, daysInMonth - elapsedDays + 1)
    : isPastMonth
      ? 1
      : daysInMonth

  const spent = useMemo(() => {
    const values = Object.fromEntries(categories.map((item) => [item.id, 0])) as Record<
      CategoryKey,
      number
    >
    entries
      .filter((entry) => entry.date.startsWith(monthKey))
      .forEach((entry) => {
        values[entry.category] += entry.amount
      })
    return values
  }, [entries, monthKey])

  const todaySpentByCategory = useMemo(() => {
    const values = Object.fromEntries(categories.map((item) => [item.id, 0])) as Record<
      CategoryKey,
      number
    >
    entries
      .filter((entry) => entry.date === todayStr)
      .forEach((entry) => {
        values[entry.category] += entry.amount
      })
    return values
  }, [entries, todayStr])

  const totalSpent = Object.values(spent).reduce((sum, amount) => sum + amount, 0)
  const totalTodaySpent = Object.values(todaySpentByCategory).reduce((sum, amount) => sum + amount, 0)

  const changeMonth = (nextMonth: string) => {
    setMonthKey(nextMonth)
    setDraft(
      initialBudgets.find((item) => item.monthKey === nextMonth) ?? {
        id: '',
        monthKey: nextMonth,
        ...defaultBudget,
      },
    )
    setMessage('')
  }

  const save = () => {
    if (!user) {
      setMessage('Please sign in first')
      return
    }
    startTransition(async () => {
      try {
        const payload = {
          monthKey,
          totalBudget: draft.totalBudget,
          food: draft.food,
          transport: draft.transport,
          shopping: draft.shopping,
          bills: draft.bills,
          entertainment: draft.entertainment,
          other: draft.other,
        }
        const res = await fetch(
          `${API_BASE}/api/spendwise/budgets/${monthKey}?userId=${user.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )
        if (!res.ok) throw new Error('Failed to save budget')
        const savedData = await res.json()
        setDraft((current) => ({ ...current, id: String(savedData.id ?? current.id) }))
        setMessage('Budget limits saved to PostgreSQL')
        router.refresh()
      } catch {
        setMessage('Could not save budget limits to backend')
      }
    })
  }

  // Monthly vs Daily display figures
  const baseDailyOverall = draft.totalBudget / daysInMonth
  const remainingMonthlyOverall = draft.totalBudget - totalSpent
  const compensatedTodayLimit = remainingMonthlyOverall / remainingDays

  const displayedOverallLimit =
    viewMode === 'monthly' ? draft.totalBudget : Math.max(0, compensatedTodayLimit)
  const displayedOverallSpent = viewMode === 'monthly' ? totalSpent : totalTodaySpent
  const overallPercent = displayedOverallLimit
    ? (displayedOverallSpent / displayedOverallLimit) * 100
    : displayedOverallSpent > 0
      ? 100
      : 0

  return (
    <main className="mx-auto max-w-[1300px] px-5 py-7 lg:px-8">
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#7c8598]">
            <span>Dashboard</span>
            <span>/</span>
            <span>{viewMode === 'monthly' ? 'Budgets' : 'Daily Budgets'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-[36px]">
            {viewMode === 'monthly' ? 'Monthly Budgets' : 'Daily Budgets'}
          </h1>
          <p className="mt-1.5 text-sm text-[#747e91] dark:text-[#99a4b8]">
            {viewMode === 'monthly'
              ? 'Set clear category limits and track every rupee against your plan.'
              : `Base daily pace is ${currency.format(baseDailyOverall)}/day across ${daysInMonth} days — adjusted for compensation across ${remainingDays} remaining ${remainingDays === 1 ? 'day' : 'days'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Monthly / Daily Switcher */}
          <div className="flex rounded-xl border border-[#dfe3e9] bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#131a26]">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                viewMode === 'monthly'
                  ? 'bg-[#172037] text-white shadow-sm dark:bg-[#eef2ff] dark:text-[#172037]'
                  : 'text-[#7c8597] hover:text-[#172037] dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                viewMode === 'daily'
                  ? 'bg-[#172037] text-white shadow-sm dark:bg-[#eef2ff] dark:text-[#172037]'
                  : 'text-[#7c8597] hover:text-[#172037] dark:hover:text-white'
              }`}
            >
              Daily
            </button>
          </div>

          <label className="w-fit">
            <input
              type="month"
              value={monthKey}
              onChange={(event) => changeMonth(event.target.value)}
              className="h-10 rounded-xl border border-[#dfe3e9] bg-white px-3 text-sm font-extrabold shadow-sm outline-none dark:border-white/10 dark:bg-[#131a26]"
              aria-label="Budget month"
            />
          </label>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-[#dfe4ff] bg-gradient-to-r from-[#f1f4ff] to-white p-5 shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-[#6375cc]/30 dark:from-[#171e35] dark:to-[#131a26]">
        <div className="grid items-end gap-5 md:grid-cols-[1fr_220px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7180cf]">
                  {viewMode === 'monthly'
                    ? 'Overall monthly budget'
                    : 'Today’s compensated daily limit'}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-[-0.05em]">
                    {currency.format(displayedOverallSpent)}
                  </span>
                  <span className="text-sm font-bold text-[#8b94a5]">
                    of {currency.format(displayedOverallLimit)}
                  </span>
                </div>
                {viewMode === 'daily' && (
                  <p className="mt-1 text-xs font-semibold text-[#747e91] dark:text-[#99a4b8]">
                    {compensatedTodayLimit < 0
                      ? `Over monthly budget by ${currency.format(Math.abs(compensatedTodayLimit))} per remaining day — cut discretionary spend on other days.`
                      : `Base: ${currency.format(baseDailyOverall)}/day · ${currency.format(Math.max(0, remainingMonthlyOverall))} left for ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                  overallPercent > 100 || compensatedTodayLimit < 0
                    ? 'bg-[#ffe8e3] text-[#d35e47]'
                    : 'bg-[#e5f6ee] text-[#278b68]'
                }`}
              >
                {overallPercent > 100 || compensatedTodayLimit < 0
                  ? 'Over pace'
                  : `${Math.round(100 - overallPercent)}% left today`}
              </span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white shadow-inner dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  overallPercent > 100 || compensatedTodayLimit < 0
                    ? 'bg-[#ef765d]'
                    : 'bg-[#6579e8]'
                }`}
                style={{ width: `${Math.min(Math.max(overallPercent, 0), 100)}%` }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="total-budget"
              className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8a94a5]"
            >
              {viewMode === 'monthly'
                ? 'Edit overall monthly limit'
                : `Edit base daily limit (×${daysInMonth}d)`}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#8a94a5]">
                ₹
              </span>
              <input
                id="total-budget"
                type="number"
                min="0"
                value={
                  viewMode === 'monthly'
                    ? draft.totalBudget
                    : Math.round(draft.totalBudget / daysInMonth)
                }
                onChange={(event) => {
                  const val = Math.max(0, Number(event.target.value))
                  setDraft((current) => ({
                    ...current,
                    totalBudget: viewMode === 'monthly' ? val : val * daysInMonth,
                  }))
                }}
                className="h-11 w-full rounded-xl border border-[#dce1ec] bg-white pr-3 pl-8 text-sm font-extrabold outline-none focus:border-[#7183e8] dark:border-white/10 dark:bg-[#101620]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e5ea] bg-white shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-white/10 dark:bg-[#131a26]">
        <div className="flex items-center justify-between border-b border-[#e8eaee] px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-lg font-extrabold">
              {viewMode === 'monthly' ? 'Category limits' : 'Daily category allowances'}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-[#9199a8]">
              {viewMode === 'monthly'
                ? 'Adjust the input or drag the slider'
                : 'Shows how much you should spend today after past/today spend compensation'}
            </p>
          </div>
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0f2f7] text-[#687386] dark:bg-white/10">
            <Icon name="sliders" className="size-[17px]" />
          </span>
        </div>

        <div className="grid divide-y divide-[#edf0f3] dark:divide-white/10 lg:grid-cols-2 lg:divide-y-0">
          {categories.map((category, index) => {
            const monthlyLimit = draft[category.id]
            const monthlySpentAmount = spent[category.id]
            const todaySpentAmount = todaySpentByCategory[category.id]

            const baseDailyCat = monthlyLimit / daysInMonth
            const remainingCatMonthly = monthlyLimit - monthlySpentAmount
            const compensatedDailyCat = remainingCatMonthly / remainingDays

            const activeLimit =
              viewMode === 'monthly' ? monthlyLimit : Math.max(0, compensatedDailyCat)
            const activeSpent = viewMode === 'monthly' ? monthlySpentAmount : todaySpentAmount

            const percent = activeLimit
              ? (activeSpent / activeLimit) * 100
              : activeSpent > 0
                ? 100
                : 0
            const over =
              viewMode === 'monthly'
                ? monthlySpentAmount > monthlyLimit
                : todaySpentAmount > compensatedDailyCat || compensatedDailyCat < 0

            const deltaAmount =
              viewMode === 'monthly'
                ? monthlySpentAmount - monthlyLimit
                : todaySpentAmount - compensatedDailyCat

            return (
              <div
                key={category.id}
                className={`p-5 ${
                  index % 2 === 0
                    ? 'lg:border-r lg:border-[#edf0f3] lg:dark:border-white/10'
                    : ''
                } ${index > 1 ? 'lg:border-t lg:border-[#edf0f3] lg:dark:border-white/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-xl"
                      style={{ backgroundColor: `${category.color}18`, color: category.color }}
                    >
                      <Icon name={category.icon} className="size-[18px]" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{category.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#8f98a8]">
                        {viewMode === 'monthly'
                          ? `${currency.format(monthlySpentAmount)} spent this month`
                          : `${currency.format(todaySpentAmount)} today · base ${currency.format(baseDailyCat)}/day`}
                      </p>
                    </div>
                  </div>
                  {over ? (
                    <span className="rounded-md bg-[#fff0ed] px-2 py-1 text-[9px] font-extrabold text-[#d35e47] dark:bg-[#582f2a]/50">
                      ₹{Math.round(Math.abs(deltaAmount)).toLocaleString('en-IN')} over
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#8992a4]">
                      {currency.format(Math.max(0, activeLimit - activeSpent))} left
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(
                      viewMode === 'monthly' ? 50000 : 3000,
                      activeSpent * 1.25,
                    )}
                    step={viewMode === 'monthly' ? '500' : '50'}
                    value={
                      viewMode === 'monthly'
                        ? monthlyLimit
                        : Math.round(baseDailyCat)
                    }
                    onChange={(event) => {
                      const val = Number(event.target.value)
                      setDraft((current) => ({
                        ...current,
                        [category.id]: viewMode === 'monthly' ? val : val * daysInMonth,
                      }))
                    }}
                    className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#667ae8]"
                    aria-label={`${category.name} budget slider`}
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8a94a5]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={
                        viewMode === 'monthly'
                          ? monthlyLimit
                          : Math.round(baseDailyCat)
                      }
                      onChange={(event) => {
                        const val = Math.max(0, Number(event.target.value))
                        setDraft((current) => ({
                          ...current,
                          [category.id]: viewMode === 'monthly' ? val : val * daysInMonth,
                        }))
                      }}
                      className="h-9 w-full rounded-lg border border-[#e1e5ea] bg-[#fafbfc] pr-2 pl-6 text-xs font-extrabold outline-none focus:border-[#7183e8] dark:border-white/10 dark:bg-[#101620]"
                      aria-label={`${category.name} budget`}
                    />
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f3] dark:bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.max(percent, 0), 100)}%`,
                      backgroundColor: over ? '#ef765d' : category.color,
                    }}
                  />
                </div>

                <div className="mt-1.5 flex justify-between text-[9px] font-bold text-[#98a0af]">
                  <span>
                    {viewMode === 'monthly'
                      ? `${Math.round(percent)}% used`
                      : compensatedDailyCat < 0
                        ? 'Compensate on other days'
                        : `Safe today: ${currency.format(compensatedDailyCat)}`}
                  </span>
                  <span>
                    {viewMode === 'monthly'
                      ? `${currency.format(monthlyLimit)} limit`
                      : `${currency.format(Math.max(0, compensatedDailyCat))} today cap`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e1e5ea] bg-[#fafbfc] p-4 sm:flex-row dark:border-white/10 dark:bg-white/[0.025]">
          <p className="text-xs font-bold text-[#7d8799]">
            {message || 'Changes apply to the selected month.'}
          </p>
          <button
            onClick={save}
            disabled={isPending}
            type="button"
            className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#172037] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#26314d] disabled:cursor-wait disabled:opacity-70 dark:bg-[#eef2ff] dark:text-[#172037]"
          >
            <Icon name="save" className="size-4" />
            {isPending ? 'Saving…' : 'Save Budget Limits'}
          </button>
        </div>
      </section>
    </main>
  )
}
