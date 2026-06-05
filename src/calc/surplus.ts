import type { Scenario } from '../types'
import { availableMonthlyIncome } from './income'
import { totalTrueMonthlyCost } from './normalize'
import { totalSinkingMonthly } from './sinkingFunds'

export interface BudgetSummary {
  availableIncome: number
  trueMonthlyCost: number
  sinkingMonthly: number
  surplus: number
  allocation: {
    emergency: number
    invest: number
    buffer: number
  }
}

/** The heartbeat of the app: income − costs − sinking funds, then split. */
export function computeBudget(scenario: Scenario, from: Date = new Date()): BudgetSummary {
  const availableIncome = availableMonthlyIncome(scenario.income, scenario.annualBenefits)
  const trueMonthlyCost = totalTrueMonthlyCost(scenario.expenses)
  const sinkingMonthly = totalSinkingMonthly(scenario.sinkingFunds, from)
  const surplus = availableIncome - trueMonthlyCost - sinkingMonthly

  const { emergencyTopUpPct, investPct, bufferPct } = scenario.allocation
  const investable = Math.max(0, surplus)
  return {
    availableIncome,
    trueMonthlyCost,
    sinkingMonthly,
    surplus,
    allocation: {
      emergency: investable * (emergencyTopUpPct / 100),
      invest: investable * (investPct / 100),
      buffer: investable * (bufferPct / 100),
    },
  }
}
