import { z } from 'zod'
import { CURRENCIES, LEDGER_CATEGORIES } from './ledger-shared'

// Request bodies for the ledger routes. The keys here are also the column
// whitelist for the dynamic UPDATE in app/api/admin/whf-cio/ledger/[id].

const zDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine(v => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), 'must be a real date')
const zAmount = z.coerce.number().finite().min(0).max(1_000_000_000).transform(n => Math.round(n * 100) / 100)
const zCurrency = z.enum(CURRENCIES)
const zOptText = (max: number) => z.string().trim().max(max).nullish().transform(v => v || null)
// For partial updates: an omitted field stays undefined (left alone), while
// an empty string or null clears it.
const zClearable = (max: number) => z.string().trim().max(max).nullish().transform(v => (v === undefined ? undefined : v || null))

export const ManualEntrySchema = z.object({
  occurred_on: zDate,
  direction: z.enum(['in', 'out']),
  amount: zAmount,
  currency: zCurrency,
  description: z.string().trim().min(1).max(300),
  category: z.enum(LEDGER_CATEGORIES).nullish(),
  account_label: zOptText(100),
  counterparty: zOptText(300),
  is_transfer: z.boolean().optional(),
  is_public: z.boolean().optional(),
})

export const OverrideSchema = z.object({
  occurred_on: zDate.optional(),
  direction: z.enum(['in', 'out']).optional(),
  amount: zAmount.optional(),
  currency: zCurrency.optional(),
  description: z.string().trim().min(1).max(300).optional(),
  category: z.enum(LEDGER_CATEGORIES).nullish(),
  account_label: zClearable(100),
  counterparty: zClearable(300),
  is_transfer: z.boolean().optional(),
  is_public: z.boolean().optional(),
  excluded: z.boolean().optional(),
  override_reason: z.string().trim().max(500).optional(),
})
