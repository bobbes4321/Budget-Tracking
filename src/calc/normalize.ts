import type { Expense, ExpenseCategory } from '../types'

/** Monthly-equivalent cost of a single expense (yearly €360 → €30/mo). */
export function monthlyEquivalent(expense: Expense): number {
  const n = expense.frequency.everyMonths
  if (!n || n <= 0) return 0
  return expense.amount / n
}

/** Sum of all expenses normalized to a monthly figure. */
export function totalTrueMonthlyCost(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
}

export interface CategoryTotal {
  category: ExpenseCategory
  total: number
}

/** Per-category monthly totals, descending, omitting empty categories. */
export function categoryBreakdown(expenses: Expense[]): CategoryTotal[] {
  const map = new Map<ExpenseCategory, number>()
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + monthlyEquivalent(e))
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}
