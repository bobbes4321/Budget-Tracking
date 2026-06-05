import type { SinkingFund } from '../types'
import { monthsUntil } from '../utils/dates'

/** Monthly amount to set aside to hit a fund's target on time. */
export function requiredMonthly(fund: SinkingFund, from: Date = new Date()): number {
  const remaining = Math.max(0, fund.targetCost - fund.alreadySaved)
  if (remaining === 0) return 0
  if (fund.targetDate) {
    const monthsLeft = Math.max(1, monthsUntil(fund.targetDate, from))
    return remaining / monthsLeft
  }
  return fund.fixedMonthly ?? 0
}

/** Total monthly load across all sinking funds. */
export function totalSinkingMonthly(funds: SinkingFund[], from: Date = new Date()): number {
  return funds.reduce((s, f) => s + requiredMonthly(f, from), 0)
}

export interface FundProgress {
  fund: SinkingFund
  monthly: number
  remaining: number
  pctComplete: number
  /** Months to completion when using a fixed monthly (no target date). */
  monthsToComplete: number | null
}

export function fundProgress(fund: SinkingFund, from: Date = new Date()): FundProgress {
  const remaining = Math.max(0, fund.targetCost - fund.alreadySaved)
  const monthly = requiredMonthly(fund, from)
  const pctComplete =
    fund.targetCost > 0 ? Math.min(1, fund.alreadySaved / fund.targetCost) : 1
  let monthsToComplete: number | null = null
  if (!fund.targetDate && fund.fixedMonthly && fund.fixedMonthly > 0 && remaining > 0) {
    monthsToComplete = Math.ceil(remaining / fund.fixedMonthly)
  }
  return { fund, monthly, remaining, pctComplete, monthsToComplete }
}
