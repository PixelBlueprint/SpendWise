'use client'

import { useMemo, useState } from 'react'
import {
  categories,
  compactCurrency,
  currency,
  shiftDate,
  type CategoryKey,
  type ExpenseEntry,
} from './types'

function aggregate(entries: ExpenseEntry[], dates: string[]) {
  return dates.map((date) => {
    const amounts = Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<
      CategoryKey,
      number
    >
    entries
      .filter((entry) => entry.date === date)
      .forEach((entry) => {
        amounts[entry.category] += entry.amount
      })
    return { date, amounts, total: Object.values(amounts).reduce((sum, amount) => sum + amount, 0) }
  })
}

export function SpendingCharts({
  entries,
  selectedDate,
  dailyAmounts,
  budget,
  projected,
}: {
  entries: ExpenseEntry[]
  selectedDate: string
  dailyAmounts: Record<CategoryKey, number>
  budget: number
  projected: number
}) {
  const [range, setRange] = useState<7 | 30>(7)
  const [barHover, setBarHover] = useState<number | null>(null)
  const [donutHover, setDonutHover] = useState<CategoryKey | null>(null)
  const [lineHover, setLineHover] = useState<number | null>(null)
  const dates = useMemo(
    () => Array.from({ length: range }, (_, index) => shiftDate(selectedDate, index - range + 1)),
    [range, selectedDate],
  )
  const chartDays = useMemo(() => aggregate(entries, dates), [entries, dates])
  const total = Object.values(dailyAmounts).reduce((sum, amount) => sum + amount, 0)
  const maxBar = Math.max(1000, ...chartDays.map((day) => day.total))
  let donutOffset = 0

  const [year, month, selectedDay] = selectedDate.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthPrefix = selectedDate.slice(0, 7)
  const monthDaily = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${monthPrefix}-${String(index + 1).padStart(2, '0')}`
    return entries
      .filter((entry) => entry.date === date)
      .reduce((sum, entry) => sum + entry.amount, 0)
  })
  let running = 0
  const cumulative = monthDaily.map((amount) => (running += amount))
  const chartMax = Math.max(budget, projected, cumulative[selectedDay - 1] || 0, 1) * 1.08
  const point = (day: number, value: number) => ({
    x: 38 + ((day - 1) / Math.max(daysInMonth - 1, 1)) * 700,
    y: 130 - (value / chartMax) * 116,
  })
  const actualPoints = cumulative
    .slice(0, selectedDay)
    .map((value, index) => point(index + 1, value))
  const budgetPoints = [point(1, budget / daysInMonth), point(daysInMonth, budget)]
  const forecastPoints = [
    point(selectedDay, cumulative[selectedDay - 1] || 0),
    point(daysInMonth, projected),
  ]

  return (
    <section className="rounded-2xl border border-[#e1e5ea] bg-white shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-white/10 dark:bg-[#131a26]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaee] px-5 py-4 dark:border-white/10">
        <div>
          <h2 className="text-lg font-extrabold tracking-[-0.025em]">Spending Analytics</h2>
          <p className="mt-0.5 text-xs font-semibold text-[#9199a8]">
            Patterns, category mix and budget pace
          </p>
        </div>
        <div className="flex rounded-lg bg-[#f1f3f6] p-1 dark:bg-white/[0.07]">
          {([7, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${range === days ? 'bg-white text-[#202a40] shadow-sm dark:bg-[#313a4b] dark:text-white' : 'text-[#8b94a5]'}`}
              type="button"
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,.55fr)]">
        <div className="border-b border-[#e8eaee] p-5 dark:border-white/10 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold">Daily category spend</p>
              <p className="mt-1 text-xs text-[#929aa9]">Stacked by category · {range} days</p>
            </div>
            <span className="text-xs font-bold text-[#7d8799]">
              {compactCurrency.format(total)} selected
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex h-[174px] flex-col justify-between pb-px text-[9px] font-semibold text-[#a0a8b7]">
              <span>{compactCurrency.format(maxBar)}</span>
              <span>{compactCurrency.format(maxBar * 0.5)}</span>
              <span>₹0</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative h-[174px] border-b border-[#cfd5de] dark:border-white/20">
                {[0, 50].map((top) => (
                  <span
                    key={top}
                    className="absolute right-0 left-0 border-t border-dashed border-[#e8eaee] dark:border-white/[0.07]"
                    style={{ top: `${top}%` }}
                  />
                ))}
                <div className="absolute inset-0 flex items-end justify-around gap-[2px] px-1">
                  {chartDays.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setBarHover(dayIndex)}
                      onMouseLeave={() => setBarHover(null)}
                      className="group relative flex h-full min-w-0 flex-1 cursor-crosshair flex-col-reverse justify-start"
                    >
                      {categories.map((category) => (
                        <span
                          key={category.id}
                          className="block w-full transition-opacity group-hover:opacity-80 first:rounded-b-[2px] last:rounded-t-[2px]"
                          style={{
                            height: `${Math.max(day.amounts[category.id] ? 1.5 : 0, (day.amounts[category.id] / maxBar) * 100)}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      ))}
                      {barHover === dayIndex && (
                        <div
                          className={`absolute bottom-[calc(100%+8px)] z-30 w-44 rounded-xl bg-[#172037] p-3 text-white shadow-xl ${dayIndex > chartDays.length / 2 ? 'right-0' : 'left-0'}`}
                        >
                          <p className="mb-2 text-[10px] font-extrabold">
                            {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            · {currency.format(day.total)}
                          </p>
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="flex justify-between text-[9px] leading-4 text-white/75"
                            >
                              <span>{category.name}</span>
                              <span>{currency.format(day.amounts[category.id])}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex justify-around gap-[2px] px-1 text-[8px] font-bold text-[#929aa9]">
                {chartDays.map((day, index) => (
                  <span key={day.date} className="min-w-0 flex-1 text-center">
                    {range === 7
                      ? new Date(`${day.date}T12:00:00`).toLocaleDateString('en-IN', {
                          weekday: 'narrow',
                        })
                      : index % 4 === 0 || index === 29
                        ? String(Number(day.date.slice(-2)))
                        : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[#e8eaee] p-5 dark:border-white/10">
          <p className="text-sm font-extrabold">Category share</p>
          <p className="mt-1 text-xs text-[#929aa9]">Selected day distribution</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative size-28 shrink-0">
              <svg viewBox="0 0 42 42" className="-rotate-90">
                <circle
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  className="text-[#eef0f3] dark:text-white/10"
                />
                {categories.map((category) => {
                  const percent = total ? (dailyAmounts[category.id] / total) * 100 : 0
                  const currentOffset = donutOffset
                  donutOffset += percent
                  return (
                    <circle
                      key={category.id}
                      cx="21"
                      cy="21"
                      r="15.9"
                      fill="none"
                      stroke={category.color}
                      strokeWidth={donutHover === category.id ? 7 : 5.5}
                      strokeDasharray={`${percent} ${100 - percent}`}
                      strokeDashoffset={-currentOffset}
                      onMouseEnter={() => setDonutHover(category.id)}
                      onMouseLeave={() => setDonutHover(null)}
                      className="cursor-crosshair transition-all"
                    />
                  )
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <span className="text-[9px] font-bold text-[#949cab]">
                  {donutHover
                    ? categories.find((item) => item.id === donutHover)?.name.toUpperCase()
                    : 'TOTAL'}
                </span>
                <span className="text-sm font-extrabold">
                  {donutHover
                    ? currency.format(dailyAmounts[donutHover])
                    : compactCurrency.format(total)}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onMouseEnter={() => setDonutHover(category.id)}
                  onMouseLeave={() => setDonutHover(null)}
                  className="flex w-full items-center justify-between gap-2 text-[10px] font-bold"
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-[#697386]">
                    <i
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </span>
                  <span>
                    {total ? ((dailyAmounts[category.id] / total) * 100).toFixed(1) : '0.0'}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">Monthly budget pace</p>
              <p className="mt-1 text-xs text-[#929aa9]">
                Actual cumulative spend vs. planned pace
              </p>
            </div>
            <div className="flex gap-3 text-[10px] font-bold text-[#7e8798]">
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-4 bg-[#667ae8]" />
                Actual
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-4 border-t border-dashed border-[#aeb5c1]" />
                Budget
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-4 border-t border-dashed border-[#ee795f]" />
                AI Forecast
              </span>
            </div>
          </div>
          <div className="relative">
            {lineHover !== null && (
              <div className="absolute top-1 left-12 z-20 rounded-lg bg-[#172037] px-3 py-2 text-[10px] font-bold text-white shadow-xl">
                Day {lineHover + 1}: {currency.format(cumulative[lineHover])}
              </div>
            )}
            <svg
              viewBox="0 0 760 150"
              className="h-[145px] w-full overflow-visible"
              preserveAspectRatio="none"
              aria-label="Monthly cumulative spending line chart"
            >
              {[15, 52, 89, 126].map((y) => (
                <line
                  key={y}
                  x1="38"
                  x2="738"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 4"
                  className="text-[#e9ebef] dark:text-white/10"
                />
              ))}
              <polyline
                points={budgetPoints.map((item) => `${item.x},${item.y}`).join(' ')}
                fill="none"
                stroke="#aeb5c1"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              <polyline
                points={actualPoints.map((item) => `${item.x},${item.y}`).join(' ')}
                fill="none"
                stroke="#667ae8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={forecastPoints.map((item) => `${item.x},${item.y}`).join(' ')}
                fill="none"
                stroke="#ee795f"
                strokeWidth="2.5"
                strokeDasharray="6 5"
              />
              {actualPoints.map((item, index) => (
                <circle
                  key={index}
                  cx={item.x}
                  cy={item.y}
                  r={lineHover === index ? 5 : 3}
                  fill="#667ae8"
                  stroke="white"
                  strokeWidth="1.5"
                  className="cursor-crosshair"
                  onMouseEnter={() => setLineHover(index)}
                  onMouseLeave={() => setLineHover(null)}
                />
              ))}
              {[
                1,
                Math.ceil(daysInMonth / 4),
                Math.ceil(daysInMonth / 2),
                Math.ceil(daysInMonth * 0.75),
                daysInMonth,
              ].map((day) => (
                <text
                  key={day}
                  x={point(day, 0).x}
                  y="149"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[9px] font-bold text-[#9ba3b2]"
                >
                  {day}{' '}
                  {day === 1
                    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
                        month: 'short',
                      })
                    : ''}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
