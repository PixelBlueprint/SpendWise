export const categoryKeys = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'other',
] as const

export type CategoryKey = (typeof categoryKeys)[number]

export type ExpenseEntry = {
  id: string
  date: string
  category: CategoryKey
  amount: number
}

export type MonthlyBudget = {
  id: string
  monthKey: string
  totalBudget: number
  food: number
  transport: number
  shopping: number
  bills: number
  entertainment: number
  other: number
}

export type CategoryMeta = {
  id: CategoryKey
  name: string
  color: string
  icon: string
}

export const categories: CategoryMeta[] = [
  { id: 'food', name: 'Food', color: '#ff7657', icon: 'utensils' },
  { id: 'transport', name: 'Transport', color: '#607cff', icon: 'car' },
  { id: 'shopping', name: 'Shopping', color: '#a26af4', icon: 'bag' },
  { id: 'bills', name: 'Bills', color: '#f4b740', icon: 'receipt' },
  { id: 'entertainment', name: 'Entertainment', color: '#25b99a', icon: 'film' },
  { id: 'other', name: 'Other', color: '#8a94a6', icon: 'dots' },
]

export const defaultBudget: Omit<MonthlyBudget, 'id' | 'monthKey'> = {
  totalBudget: 75000,
  food: 18000,
  transport: 8500,
  shopping: 14000,
  bills: 20000,
  entertainment: 8500,
  other: 6000,
}

export const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const compactCurrency = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 1,
})

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDate(dateKey: string, offset: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + offset)
  return localDateKey(date)
}

export function monthKey(date = new Date()) {
  return localDateKey(date).slice(0, 7)
}
