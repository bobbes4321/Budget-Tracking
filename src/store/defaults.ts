import type { AppState, Scenario } from '../types'
import { SCHEMA_VERSION } from '../types'
import { DEFAULT_ASSUMPTIONS } from '../calc/belgian'
import { addMonthsISO } from '../utils/dates'
import { uid } from '../utils/id'

/** A realistic starter scenario for a 25-year-old in Belgium. */
export function makeDefaultScenario(name = 'Baseline'): Scenario {
  return {
    id: uid(),
    name,
    income: [{ id: uid(), name: 'Salary (net)', nettoMonthly: 2400, brutoMonthly: 3200 }],
    annualBenefits: [
      { id: uid(), name: 'Vakantiegeld (holiday pay)', annualNetAmount: 2000, treatment: 'smoothIntoBudget' },
      { id: uid(), name: 'Eindejaarspremie (13th month)', annualNetAmount: 2400, treatment: 'investableWindfall' },
    ],
    restrictedBenefits: [
      { id: uid(), name: 'Maaltijdcheques (meal vouchers)', monthlyValue: 160, offsetsCategory: 'groceries' },
    ],
    expenses: [
      { id: uid(), name: 'Rent', amount: 850, frequency: { everyMonths: 1 }, category: 'housing' },
      { id: uid(), name: 'Electricity & gas', amount: 120, frequency: { everyMonths: 1 }, category: 'utilities' },
      { id: uid(), name: 'Internet & mobile', amount: 50, frequency: { everyMonths: 1 }, category: 'subscriptions' },
      { id: uid(), name: 'Car insurance', amount: 360, frequency: { everyMonths: 12 }, category: 'insurance' },
      { id: uid(), name: 'Groceries', amount: 350, frequency: { everyMonths: 1 }, category: 'groceries', isVariableAllowance: true },
      { id: uid(), name: 'Public transport', amount: 80, frequency: { everyMonths: 1 }, category: 'transport' },
      { id: uid(), name: 'Going out & hobbies', amount: 150, frequency: { everyMonths: 1 }, category: 'leisure', isVariableAllowance: true },
      { id: uid(), name: 'Streaming services', amount: 30, frequency: { everyMonths: 1 }, category: 'subscriptions' },
    ],
    sinkingFunds: [
      {
        id: uid(),
        name: "Driver's license",
        targetCost: 1800,
        alreadySaved: 0,
        targetDate: addMonthsISO(12),
      },
    ],
    allocation: { emergencyTopUpPct: 20, investPct: 70, bufferPct: 10 },
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    pension: {
      currentAge: 25,
      retirementAge: 67,
      targetCapital: 500000,
      startingCapital: 0,
      pensioensparenRegime: 'low',
      pensioensparenAnnual: 1020,
      reinvestTaxRefund: true,
      pillarEndTaxPct: 8,
    },
  }
}

export function makeDefaultState(): AppState {
  const scenario = makeDefaultScenario()
  return {
    schemaVersion: SCHEMA_VERSION,
    scenarios: [scenario],
    activeScenarioId: scenario.id,
    comparisonIds: [scenario.id],
  }
}
