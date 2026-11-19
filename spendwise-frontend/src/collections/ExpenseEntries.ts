import type { CollectionConfig } from 'payload'

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'other',
] as const

export const ExpenseEntries: CollectionConfig = {
  slug: 'expense-entries',
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    group: 'SpendWise',
    useAsTitle: 'entryKey',
    defaultColumns: ['entryDate', 'category', 'amount', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.entryDate && data?.category) {
          data.entryKey = `${String(data.entryDate).slice(0, 10)}:${data.category}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'entryKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'entryDate',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd MMM yyyy',
        },
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Food', value: 'food' },
        { label: 'Transport', value: 'transport' },
        { label: 'Shopping', value: 'shopping' },
        { label: 'Bills', value: 'bills' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      max: 100000000,
    },
  ],
  versions: false,
}
