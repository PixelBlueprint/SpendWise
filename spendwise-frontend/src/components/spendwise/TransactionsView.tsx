'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Icon } from './Icon'
import { categories, currency, type CategoryKey, type ExpenseEntry } from './types'

export function TransactionsView({ initialEntries }: { initialEntries: ExpenseEntry[] }) {
  const [entries, setEntries] = useState<ExpenseEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | CategoryKey>('all')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const meta = categories.find((item) => item.id === entry.category)
        return (
          (category === 'all' || entry.category === category) &&
          (!date || entry.date === date) &&
          (!search ||
            meta?.name.toLowerCase().includes(search.toLowerCase()) ||
            entry.date.includes(search) ||
            String(entry.amount).includes(search))
        )
      }),
    [category, date, entries, search],
  )

  const filteredTotal = filtered.reduce((sum, entry) => sum + entry.amount, 0)

  const remove = (id: string) => {
    if (!window.confirm('Delete this expense entry?')) return
    startTransition(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/spendwise/expenses/${id}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Failed to delete')
        setEntries((current) => current.filter((entry) => entry.id !== id))
        setMessage('Transaction deleted')
      } catch {
        setMessage('Could not delete transaction from backend')
      }
    })
  }

  return (
    <main className="mx-auto max-w-[1450px] px-5 py-7 lg:px-8">
      <section className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#7c8598]">
            <span>Dashboard</span>
            <span>/</span>
            <span>Transactions</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-[36px]">
            Transactions
          </h1>
          <p className="mt-1.5 text-sm text-[#747e91] dark:text-[#99a4b8]">
            Search, filter, and manage every saved category entry.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-[#8a94a5]">Filtered total</p>
          <p className="text-2xl font-extrabold tracking-[-0.04em]">
            {currency.format(filteredTotal)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e1e5ea] bg-white shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-white/10 dark:bg-[#131a26]">
        <div className="border-b border-[#e8eaee] p-4 dark:border-white/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#929bad]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search category, amount, or date…"
                className="h-11 w-full rounded-xl border border-[#e1e5ea] bg-[#fafbfc] pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#7183e8] dark:border-white/10 dark:bg-[#101620]"
              />
            </label>
            <label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 rounded-xl border border-[#e1e5ea] bg-[#fafbfc] px-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-[#101620]"
                aria-label="Filter by date"
              />
            </label>
            {(search || date || category !== 'all') && (
              <button
                onClick={() => {
                  setSearch('')
                  setDate('')
                  setCategory('all')
                }}
                className="h-11 rounded-xl px-3 text-xs font-extrabold text-[#6273d4] hover:bg-[#f1f3ff] dark:hover:bg-white/5"
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                category === 'all'
                  ? 'bg-[#172037] text-white dark:bg-white dark:text-[#172037]'
                  : 'bg-[#f0f2f5] text-[#778195] dark:bg-white/10'
              }`}
              type="button"
            >
              All
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  category === item.id ? 'text-white' : 'bg-[#f0f2f5] text-[#778195] dark:bg-white/10'
                }`}
                style={category === item.id ? { backgroundColor: item.color } : undefined}
                type="button"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: category === item.id ? 'white' : item.color }}
                />
                {item.name}
              </button>
            ))}
          </div>
          {message && <p className="mt-3 text-xs font-bold text-[#6175dc]">{message}</p>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaee] bg-[#fafbfc] text-left text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8a94a5] dark:border-white/10 dark:bg-white/[0.025]">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Share of day</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f3] dark:divide-white/10">
              {filtered.map((entry) => {
                const meta = categories.find((item) => item.id === entry.category)!
                const dayTotal = entries
                  .filter((item) => item.date === entry.date)
                  .reduce((sum, item) => sum + item.amount, 0)
                return (
                  <tr
                    key={entry.id}
                    className="transition hover:bg-[#fafbfc] dark:hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-bold">
                          {new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] font-semibold text-[#9aa2b1]">
                          {new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-IN', {
                            weekday: 'long',
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-[#f3f4f6] px-2.5 py-1.5 text-xs font-extrabold dark:bg-white/10">
                        <i
                          className="size-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {meta.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-extrabold">
                        {currency.format(entry.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#edf0f3] dark:bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${dayTotal ? (entry.amount / dayTotal) * 100 : 0}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#8c95a6]">
                          {dayTotal ? Math.round((entry.amount / dayTotal) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          disabled={isPending}
                          onClick={() => remove(entry.id)}
                          className="grid size-8 place-items-center rounded-lg text-[#8b94a5] hover:bg-[#fff0ed] hover:text-[#d4614b]"
                          aria-label="Delete transaction"
                        >
                          <Icon name="trash" className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="px-5 py-16 text-center">
              <p className="font-extrabold">No transactions found</p>
              <p className="mt-1 text-sm text-[#8b94a5]">
                Adjust your search or filters to see more entries.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#e8eaee] px-5 py-3 text-xs font-bold text-[#8a94a5] dark:border-white/10">
          <span>{filtered.length} entries</span>
          <span>{new Set(filtered.map((entry) => entry.date)).size} days</span>
        </div>
      </section>
    </main>
  )
}
