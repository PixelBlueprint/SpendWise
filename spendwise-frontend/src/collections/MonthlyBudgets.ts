import type { CollectionConfig } from 'payload'

const budgetField = (name: string, label: string) =>
  ({
    name,
    label,
    type: 'number',
    required: true,
    min: 0,
    max: 100000000,
  }) as const

export const MonthlyBudgets: CollectionConfig = {
  slug: 'monthly-budgets',
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    group: 'SpendWise',
    useAsTitle: 'monthKey',
    defaultColumns: ['monthKey', 'totalBudget', 'updatedAt'],
  },
  fields: [
    {
      name: 'monthKey',
      label: 'Month',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) =>
        typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
          ? true
          : 'Use a YYYY-MM month value.',
    },
    budgetField('totalBudget', 'Overall monthly budget'),
    budgetField('food', 'Food budget'),
    budgetField('transport', 'Transport budget'),
    budgetField('shopping', 'Shopping budget'),
    budgetField('bills', 'Bills budget'),
    budgetField('entertainment', 'Entertainment budget'),
    budgetField('other', 'Other budget'),
  ],
  versions: false,
}
