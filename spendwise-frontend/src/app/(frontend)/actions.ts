'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { categoryKeys, type CategoryKey } from '@/components/spendwise/types'

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string }

const categorySet = new Set<string>(categoryKeys)

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function validMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
}

function validAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000000
}

async function payloadContext() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user }
}

export async function saveDailyExpenses(input: {
  date: string
  amounts: Record<CategoryKey, number>
}): Promise<ActionResult<{ saved: number }>> {
  if (!validDate(input?.date)) return { success: false, error: 'Choose a valid date.' }
  if (!input?.amounts || categoryKeys.some((category) => !validAmount(input.amounts[category]))) {
    return { success: false, error: 'Every amount must be between ₹0 and ₹10,00,00,000.' }
  }

  try {
    const { payload, user } = await payloadContext()
    await Promise.all(
      categoryKeys.map(async (category) => {
        const entryKey = `${input.date}:${category}`
        const existing = await payload.find({
          collection: 'expense-entries',
          depth: 0,
          limit: 1,
          overrideAccess: false,
          user,
          where: { entryKey: { equals: entryKey } },
        })
        const data = {
          entryKey,
          entryDate: input.date,
          category,
          amount: input.amounts[category],
        }

        if (existing.docs[0]) {
          await payload.update({
            collection: 'expense-entries',
            id: existing.docs[0].id,
            data,
            overrideAccess: false,
            user,
          })
        } else {
          await payload.create({
            collection: 'expense-entries',
            data,
            overrideAccess: false,
            user,
          })
        }
      }),
    )
    return { success: true, data: { saved: categoryKeys.length } }
  } catch {
    return { success: false, error: 'Unable to save these expenses. Please try again.' }
  }
}

export async function updateExpense(input: {
  id: string
  date: string
  category: CategoryKey
  amount: number
}): Promise<ActionResult> {
  if (
    typeof input?.id !== 'string' ||
    !validDate(input.date) ||
    !categorySet.has(input.category) ||
    !validAmount(input.amount)
  ) {
    return { success: false, error: 'Check the date, category, and amount.' }
  }

  try {
    const { payload, user } = await payloadContext()
    await payload.update({
      collection: 'expense-entries',
      id: input.id,
      data: {
        entryKey: `${input.date}:${input.category}`,
        entryDate: input.date,
        category: input.category,
        amount: input.amount,
      },
      overrideAccess: false,
      user,
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Unable to update this transaction.' }
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  if (typeof id !== 'string' || id.length < 1) {
    return { success: false, error: 'Invalid transaction.' }
  }
  try {
    const { payload, user } = await payloadContext()
    await payload.delete({
      collection: 'expense-entries',
      id,
      overrideAccess: false,
      user,
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Unable to delete this transaction.' }
  }
}

export async function saveMonthlyBudget(input: {
  id?: string
  monthKey: string
  totalBudget: number
  food: number
  transport: number
  shopping: number
  bills: number
  entertainment: number
  other: number
}): Promise<ActionResult<{ id: string }>> {
  if (
    !validMonth(input?.monthKey) ||
    !validAmount(input.totalBudget) ||
    categoryKeys.some((category) => !validAmount(input[category]))
  ) {
    return { success: false, error: 'All budget limits must be valid positive amounts.' }
  }

  try {
    const { payload, user } = await payloadContext()
    const data = {
      monthKey: input.monthKey,
      totalBudget: input.totalBudget,
      food: input.food,
      transport: input.transport,
      shopping: input.shopping,
      bills: input.bills,
      entertainment: input.entertainment,
      other: input.other,
    }
    let id = input.id
    if (!id) {
      const existing = await payload.find({
        collection: 'monthly-budgets',
        limit: 1,
        overrideAccess: false,
        user,
        where: { monthKey: { equals: input.monthKey } },
      })
      id = existing.docs[0] ? String(existing.docs[0].id) : undefined
    }
    const saved = id
      ? await payload.update({
          collection: 'monthly-budgets',
          id,
          data,
          overrideAccess: false,
          user,
        })
      : await payload.create({
          collection: 'monthly-budgets',
          data,
          overrideAccess: false,
          user,
        })
    return { success: true, data: { id: String(saved.id) } }
  } catch {
    return { success: false, error: 'Unable to save this budget.' }
  }
}
