'use client'

import { API_BASE } from './api'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { AiInsightCard, type LiveAiInsights } from './AiInsightCard'
import type { SpendWiseUser } from './AuthScreen'
import { Icon } from './Icon'
import { KpiCard } from './KpiCard'
import { SpendingCharts } from './SpendingCharts'
import {
  categories,
  categoryKeys,
  currency,
  defaultBudget,
  localDateKey,
  shiftDate,
  type CategoryKey,
  type ExpenseEntry,
  type MonthlyBudget,
} from './types'

function blankAmounts() {
  return Object.fromEntries(categoryKeys.map((category) => [category, 0])) as Record<
    CategoryKey,
    number
  >
}

function amountsFor(entries: ExpenseEntry[], date: string) {
  const amounts = blankAmounts()
  entries
    .filter((entry) => entry.date === date)
    .forEach((entry) => {
      amounts[entry.category] += entry.amount
    })
  return amounts
}

function toDateStr(year: number, monthIndex0: number, day: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function OverviewDashboard({
  initialEntries,
  budgets,
  user,
}: {
  initialEntries: ExpenseEntry[]
  budgets: MonthlyBudget[]
  user: SpendWiseUser
}) {
  const today = localDateKey()
  const yesterday = shiftDate(today, -1)

  const [entries, setEntries] = useState(initialEntries)
  const [selectedDate, setSelectedDate] = useState(today)
  const [draft, setDraft] = useState<Record<CategoryKey, number>>(blankAmounts)
  const [aiInsights, setAiInsights] = useState<LiveAiInsights | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Custom calendar popover state
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => Number(today.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => Number(today.slice(5, 7)) - 1) // 0-indexed

  useEffect(() => setEntries(initialEntries), [initialEntries])
  useEffect(() => {
    setDraft(blankAmounts())
    setMessage('')
    setViewYear(Number(selectedDate.slice(0, 4)))
    setViewMonth(Number(selectedDate.slice(5, 7)) - 1)
  }, [selectedDate])

  const datesWithEntries = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => {
      if (e.amount > 0) set.add(e.date)
    })
    return set
  }, [entries])

  const savedDailyAmounts = useMemo(
    () => amountsFor(entries, selectedDate),
    [entries, selectedDate],
  )

  const combinedDailyAmounts = useMemo(
    () =>
      Object.fromEntries(
        categoryKeys.map((category) => [
          category,
          savedDailyAmounts[category] + draft[category],
        ]),
      ) as Record<CategoryKey, number>,
    [savedDailyAmounts, draft],
  )

  const effectiveEntries = useMemo(() => {
    const draftEntries: ExpenseEntry[] = categoryKeys
      .filter((category) => draft[category] > 0)
      .map((category) => ({
        id: `draft-${selectedDate}-${category}`,
        date: selectedDate,
        category,
        amount: draft[category],
      }))
    return [...entries, ...draftEntries]
  }, [draft, entries, selectedDate])

  const draftTotal = Object.values(draft).reduce((sum, amount) => sum + amount, 0)
  const todayTotal = Object.values(combinedDailyAmounts).reduce((sum, amount) => sum + amount, 0)

  const selectedMonth = selectedDate.slice(0, 7)
  const budget = budgets.find((item) => item.monthKey === selectedMonth) ?? {
    id: '',
    monthKey: selectedMonth,
    ...defaultBudget,
  }
  const monthlyEntries = effectiveEntries.filter(
    (entry) => entry.date.startsWith(selectedMonth) && entry.date <= selectedDate,
  )
  const monthlyTotal = monthlyEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const selectedDay = Number(selectedDate.slice(-2))
  const [year, month] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const projected = selectedDay ? Math.round((monthlyTotal / selectedDay) * daysInMonth) : 0
  const dailyAverage = selectedDay ? monthlyTotal / selectedDay : 0
  const priorDates = new Set(
    monthlyEntries.filter((entry) => entry.date < selectedDate).map((entry) => entry.date),
  )
  const categoryAverages = Object.fromEntries(
    categoryKeys.map((category) => [
      category,
      priorDates.size
        ? monthlyEntries
            .filter((entry) => entry.category === category && entry.date < selectedDate)
            .reduce((sum, entry) => sum + entry.amount, 0) / priorDates.size
        : 0,
    ]),
  ) as Record<CategoryKey, number>

  const save = () => {
    if (draftTotal <= 0) {
      setMessage('Enter an amount in at least one category first')
      return
    }
    setMessage('')
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spendwise/expenses/day`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            date: selectedDate,
            categories: draft,
          }),
        })
        if (!res.ok) throw new Error('Failed to save expenses')
        const data = await res.json()

        setEntries(
          (data.entries ?? []).map((e: any) => ({
            id: String(e.id),
            date: e.date,
            category: e.category,
            amount: Number(e.amount),
          })),
        )
        if (data.aiInsights) setAiInsights(data.aiInsights)

        setDraft(blankAmounts())
        setMessage('Added to your total & analyzed by Gemini AI')
      } catch {
        setMessage('Could not reach Spring Boot backend on port 8080')
      }
    })
  }

  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Calendar grid cells for (viewYear, viewMonth)
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const totalDaysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const viewMonthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8 lg:py-7">
      <section className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#7c8598]">
            <span>Dashboard</span>
            <span>/</span>
            <span>Daily overview</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-[36px]">
            Good morning, {user.fullName.split(' ')[0]}
          </h1>
          <p className="mt-1.5 text-sm text-[#747e91] dark:text-[#99a4b8]">
            Here’s how your money moved on {dateLabel}.
          </p>
        </div>

        <div className="relative flex w-fit items-center rounded-xl border border-[#dfe3e9] bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#131a26]">
          {[
            { label: 'Today', value: today },
            { label: 'Yesterday', value: yesterday },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setSelectedDate(item.value)
                setCalendarOpen(false)
              }}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                selectedDate === item.value
                  ? 'bg-[#172037] text-white shadow-sm dark:bg-[#edf1fb] dark:text-[#172037]'
                  : 'text-[#7c8597] hover:text-[#172037] dark:hover:text-white'
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-[#e5e7eb] dark:bg-white/10" />

          <button
            type="button"
            onClick={() => setCalendarOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold text-[#596377] transition hover:bg-[#f4f6f9] hover:text-[#172037] dark:text-[#cbd3e6] dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Open expense calendar"
          >
            <Icon name="calendar" className="size-4" />
            <span className="hidden sm:inline">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </button>

          {calendarOpen && (
            <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-80 rounded-2xl border border-[#dfe3e9] bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#131a26]">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="grid size-8 place-items-center rounded-lg border border-[#e5e7eb] text-xs font-extrabold hover:bg-[#f4f6f9] dark:border-white/10 dark:hover:bg-white/10"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span className="text-sm font-extrabold">{viewMonthTitle}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="grid size-8 place-items-center rounded-lg border border-[#e5e7eb] text-xs font-extrabold hover:bg-[#f4f6f9] dark:border-white/10 dark:hover:bg-white/10"
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#8a94a5] mb-1.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <span key={`empty-${i}`} className="h-9" />
                ))}
                {Array.from({ length: totalDaysInViewMonth }).map((_, idx) => {
                  const dayNum = idx + 1
                  const dateStr = toDateStr(viewYear, viewMonth, dayNum)
                  const isFuture = dateStr > today
                  const isSelected = dateStr === selectedDate
                  const isToday = dateStr === today
                  const hasSpend = datesWithEntries.has(dateStr)

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isFuture}
                      title={
                        isFuture
                          ? 'Future dates are locked'
                          : `Manage spends for ${dateStr}`
                      }
                      onClick={() => {
                        if (isFuture) return
                        setSelectedDate(dateStr)
                        setCalendarOpen(false)
                      }}
                      className={`relative flex h-9 flex-col items-center justify-center rounded-xl text-xs font-bold transition ${
                        isFuture
                          ? 'cursor-not-allowed opacity-30 text-[#9ba3b2] line-through'
                          : isSelected
                            ? 'bg-[#172037] text-white shadow-sm dark:bg-[#eef2ff] dark:text-[#172037]'
                            : isToday
                              ? 'border border-[#667ae8] text-[#5368d9] hover:bg-[#f0f3ff] dark:text-[#aeb9fa] dark:hover:bg-white/10'
                              : 'text-[#2c3548] hover:bg-[#f1f3f7] dark:text-[#dce3f2] dark:hover:bg-white/10'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasSpend && !isFuture && (
                        <span
                          className={`mt-0.5 size-1 rounded-full ${
                            isSelected ? 'bg-current' : 'bg-[#667ae8]'
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#eef0f3] pt-2.5 text-[10px] font-bold text-[#8a94a5] dark:border-white/10">
                <span className="flex items-center gap-1.5">
                  <i className="size-1.5 rounded-full bg-[#667ae8]" /> Logged spend
                </span>
                <span>Future dates disabled</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(520px,.82fr)_minmax(0,1.18fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#e1e5ea] bg-white shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-white/10 dark:bg-[#131a26] xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8eaee] px-5 py-4 dark:border-white/10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8b94a5]">
                Daily tracker
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em]">Spend by Category</h2>
            </div>
            <span className="rounded-lg bg-[#eef1f5] px-2.5 py-1.5 text-xs font-bold text-[#737d90] dark:bg-white/10">
              6 categories
            </span>
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-[#e8eaee] p-3 transition focus-within:border-[#8a9af1] hover:bg-[#f8f9fb] dark:border-white/10 dark:hover:bg-white/[0.035]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-8 place-items-center rounded-lg"
                      style={{ backgroundColor: `${category.color}18`, color: category.color }}
                    >
                      <Icon name={category.icon} className="size-4" />
                    </span>
                    <label
                      htmlFor={`category-${category.id}`}
                      className="min-w-0 flex-1 text-xs font-extrabold"
                    >
                      {category.name}
                    </label>
                  </div>
                  {savedDailyAmounts[category.id] > 0 && (
                    <span className="text-[10px] font-bold text-[#8a94a5]">
                      Logged: {currency.format(savedDailyAmounts[category.id])}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#929bad]">
                    ₹
                  </span>
                  <input
                    id={`category-${category.id}`}
                    value={draft[category.id] || ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [category.id]: Math.max(0, Number(event.target.value)),
                      }))
                    }
                    type="number"
                    min="0"
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-[#e4e7ec] bg-white pl-7 pr-3 text-sm font-extrabold outline-none transition focus:border-[#6a7ff2] focus:ring-2 focus:ring-[#6a7ff2]/10 dark:border-white/10 dark:bg-[#101620]"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e1e5ea] bg-[#fafbfc] p-4 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#7b8597]">
                  {draftTotal > 0 ? 'Adding to Today’s Total' : 'Today’s Total'}
                </p>
                <p className="mt-0.5 text-[26px] font-extrabold tracking-[-0.04em]">
                  {currency.format(todayTotal)}
                </p>
                <p className="mt-0.5 text-[9px] font-bold text-[#8a94a5]">
                  {message || `${currency.format(dailyAverage)} daily average`}
                </p>
              </div>
              <button
                onClick={save}
                disabled={isPending}
                type="button"
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#172037] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(23,32,55,0.18)] transition hover:-translate-y-0.5 hover:bg-[#26314d] disabled:cursor-wait disabled:opacity-70 dark:bg-[#eef2ff] dark:text-[#172037]"
              >
                <Icon
                  name={isPending ? 'spark' : 'calculator'}
                  className={`size-4 ${isPending ? 'animate-pulse' : ''}`}
                />
                {isPending ? 'Calculating…' : 'Save & Calculate'}
              </button>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="Today’s Spend"
              value={currency.format(todayTotal)}
              detail={`${currency.format(dailyAverage)} daily avg`}
              trend={
                dailyAverage && todayTotal > dailyAverage
                  ? `+${Math.round(((todayTotal - dailyAverage) / dailyAverage) * 100)}%`
                  : undefined
              }
              icon="wallet"
            />
            <KpiCard
              label="Monthly Total vs. Budget"
              value={currency.format(monthlyTotal)}
              detail={`of ${currency.format(budget.totalBudget)}`}
              progress={budget.totalBudget ? (monthlyTotal / budget.totalBudget) * 100 : 0}
              icon="target"
            />
            <KpiCard
              label="Projected Month-End"
              value={currency.format(projected)}
              detail={`${currency.format(Math.abs(projected - budget.totalBudget))} ${projected > budget.totalBudget ? 'over' : 'under'} budget`}
              trend={
                budget.totalBudget
                  ? `${Math.round((projected / budget.totalBudget) * 100)}%`
                  : undefined
              }
              icon="forecast"
            />
          </section>
          <SpendingCharts
            entries={effectiveEntries}
            selectedDate={selectedDate}
            dailyAmounts={combinedDailyAmounts}
            budget={budget.totalBudget}
            projected={projected}
          />
          <AiInsightCard
            loading={isPending}
            dailyAmounts={combinedDailyAmounts}
            projected={projected}
            budget={budget.totalBudget}
            categoryAverages={categoryAverages}
            aiInsights={aiInsights}
          />
        </div>
      </div>
    </main>
  )
}
