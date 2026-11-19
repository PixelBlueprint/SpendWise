'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { SpendWiseUser } from './AuthScreen'
import { Icon } from './Icon'

const navigation = [
  { href: '/', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
]

interface NotificationItem {
  id: string
  title: string
  detail: string
}

function getInitials(fullName?: string): string {
  if (!fullName || !fullName.trim()) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AppHeader() {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState<SpendWiseUser | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const dark = localStorage.getItem('spendwise-theme') === 'dark'
    setDarkMode(dark)
    document.documentElement.classList.toggle('dark', dark)

    const saved = localStorage.getItem('spendwise_user')
    if (saved) {
      try {
        const parsed: SpendWiseUser = JSON.parse(saved)
        setUser(parsed)

        // Check for budget alerts to populate notifications
        fetch(`http://localhost:8080/api/spendwise/dashboard?userId=${parsed.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!data) return
            const entries = data.entries ?? []
            const budget = (data.budgets ?? [])[0]
            if (!budget) return

            const alerts: NotificationItem[] = []
            const monthKey = budget.monthKey
            const monthEntries = entries.filter((e: any) => String(e.date).startsWith(monthKey))
            const totalSpent = monthEntries.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

            if (totalSpent > Number(budget.totalBudget)) {
              alerts.push({
                id: 'overall-budget',
                title: 'Monthly budget exceeded',
                detail: `You've spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${Number(budget.totalBudget).toLocaleString('en-IN')} limit.`,
              })
            }

            setNotifications(alerts)
          })
          .catch(() => {})
      } catch {
        setUser(null)
      }
    }
  }, [pathname])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('spendwise-theme', next ? 'dark' : 'light')
  }

  const signOut = () => {
    localStorage.removeItem('spendwise_user')
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e3e6eb] bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#111722]/90">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-5 px-5 py-3.5 lg:px-8">
        <Link
          className="flex min-w-0 items-center gap-2.5 justify-self-start"
          href="/"
          aria-label="SpendWise home"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#172037] text-white shadow-sm dark:bg-[#f2f5ff] dark:text-[#172037]">
            <Icon name="spark" className="size-[18px]" />
          </span>
          <span className="hidden text-xl font-extrabold tracking-[-0.04em] sm:inline">
            SpendWise
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  active
                    ? 'bg-[#f0f2f5] text-[#172037] dark:bg-white/10 dark:text-white'
                    : 'text-[#798296] hover:text-[#172037] dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="relative flex items-center gap-2 justify-self-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-10 place-items-center rounded-xl border border-[#e3e6eb] bg-white text-[#606a7e] transition hover:border-[#bdc4ce] dark:border-white/10 dark:bg-white/5 dark:text-[#cbd3e6]"
            aria-label="Toggle dark mode"
          >
            <Icon name={darkMode ? 'sun' : 'moon'} className="size-[18px]" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev)
                setProfileOpen(false)
              }}
              className="relative grid size-10 place-items-center rounded-xl border border-[#e3e6eb] bg-white text-[#606a7e] transition hover:border-[#bdc4ce] dark:border-white/10 dark:bg-white/5 dark:text-[#cbd3e6]"
              aria-label="Notifications"
            >
              <Icon name="bell" className="size-[18px]" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 size-2 rounded-full bg-[#ef765d]" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#e3e6eb] bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#131a26]">
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#8a94a5]">
                  Notifications
                </p>
                {notifications.length === 0 ? (
                  <p className="mt-3 text-sm font-semibold text-[#7c8598]">No notifications</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl bg-[#f7f8fa] p-3 text-xs dark:bg-white/5"
                      >
                        <p className="font-extrabold text-[#172037] dark:text-white">{n.title}</p>
                        <p className="mt-1 text-[#747e91] dark:text-[#99a4b8]">{n.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* User Initials Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev)
                setNotifOpen(false)
              }}
              className="ml-1 grid size-10 place-items-center rounded-xl bg-[#dbe1ff] text-sm font-extrabold text-[#4355b9] transition hover:opacity-90 dark:bg-[#3e487a] dark:text-white"
              aria-label="Account menu"
            >
              {getInitials(user?.fullName)}
            </button>

            {profileOpen && user && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#e3e6eb] bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#131a26]">
                <div className="border-b border-[#edf0f3] pb-2.5 dark:border-white/10">
                  <p className="truncate text-sm font-extrabold">{user.fullName}</p>
                  <p className="truncate text-xs text-[#8a94a5]">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs font-extrabold text-[#d35e47] transition hover:bg-[#fff0ed] dark:hover:bg-[#582f2a]/40"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav
        className="flex border-t border-[#eef0f3] px-4 md:hidden dark:border-white/10"
        aria-label="Mobile primary"
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 border-b-2 px-2 py-2.5 text-center text-xs font-extrabold ${
              pathname === item.href
                ? 'border-[#667ae8] text-[#5368d9]'
                : 'border-transparent text-[#8b94a5]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
