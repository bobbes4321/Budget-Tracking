// ============================================================================
// Domain types for the budgeting & investment-planning app.
// All money values are in EUR. All "pct" values are percentages (7 = 7%).
// ============================================================================

export type ExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'insurance'
  | 'transport'
  | 'subscriptions'
  | 'groceries'
  | 'health'
  | 'leisure'
  | 'debt'
  | 'other'

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'housing', label: 'Housing / Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'transport', label: 'Transport' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'health', label: 'Health' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'debt', label: 'Debt / Loans' },
  { value: 'other', label: 'Other' },
]

/** How often an expense recurs. `n` months between occurrences. */
export interface Frequency {
  /** Number of months between occurrences. 1 = monthly, 3 = quarterly, 12 = yearly. */
  everyMonths: number
}

export const FREQUENCY_PRESETS: { label: string; everyMonths: number }[] = [
  { label: 'Monthly', everyMonths: 1 },
  { label: 'Every 2 months', everyMonths: 2 },
  { label: 'Quarterly (3 mo)', everyMonths: 3 },
  { label: 'Every 4 months', everyMonths: 4 },
  { label: 'Twice a year (6 mo)', everyMonths: 6 },
  { label: 'Yearly', everyMonths: 12 },
]

export interface Expense {
  id: string
  name: string
  /** Amount per single occurrence. */
  amount: number
  frequency: Frequency
  category: ExpenseCategory
  /** Variable allowance (groceries, leisure) rather than a fixed bill. */
  isVariableAllowance?: boolean
  note?: string
}

export interface IncomeItem {
  id: string
  name: string
  nettoMonthly: number
  /** Reference only — drives the "you keep X%" ratio. */
  brutoMonthly?: number
}

/** Lumpy cash benefits: vakantiegeld, eindejaarspremie. */
export type AnnualBenefitTreatment = 'smoothIntoBudget' | 'investableWindfall'
export interface AnnualBenefit {
  id: string
  name: string
  annualNetAmount: number
  treatment: AnnualBenefitTreatment
}

/** Non-cash / restricted benefits: maaltijdcheques, ecocheques, hospi insurance. */
export interface RestrictedBenefit {
  id: string
  name: string
  monthlyValue: number
  /** Category this benefit offsets (e.g. meal vouchers offset groceries). */
  offsetsCategory?: ExpenseCategory
}

export interface SinkingFund {
  id: string
  name: string
  targetCost: number
  alreadySaved: number
  /** ISO date (YYYY-MM-DD). If absent, `fixedMonthly` is used instead. */
  targetDate?: string
  /** Used when there is no target date. */
  fixedMonthly?: number
}

export interface Assumptions {
  nominalReturnPct: number
  /** Set to 0 to treat the nominal return as already-real. */
  inflationPct: number
  /** Beurstaks / TOB per contribution, as a drag. */
  tobPct: number
  /** Capital-gains / solidarity tax on financial-asset gains at withdrawal. */
  capitalGainsTaxPct: number
  /** Reynders tax on bond-component gains (0 for all-equity). */
  reyndersTaxPct: number
}

export type PensioensparenRegime = 'none' | 'low' | 'high'

export interface PensionConfig {
  currentAge: number
  retirementAge: number
  /** Optional savings target at retirement — drives the backward solve. */
  targetCapital?: number
  /** Starting amount already invested toward retirement. */
  startingCapital: number
  pensioensparenRegime: PensioensparenRegime
  pensioensparenAnnual: number
  /** Reinvest the 30%/25% tax refund, or treat it as cash. */
  reinvestTaxRefund: boolean
  /** One-off tax on the pillar pot at maturity (~age 60). */
  pillarEndTaxPct: number
}

export interface AllocationPlan {
  emergencyTopUpPct: number
  investPct: number
  bufferPct: number
}

export interface Scenario {
  id: string
  name: string
  income: IncomeItem[]
  annualBenefits: AnnualBenefit[]
  restrictedBenefits: RestrictedBenefit[]
  expenses: Expense[]
  sinkingFunds: SinkingFund[]
  allocation: AllocationPlan
  assumptions: Assumptions
  pension: PensionConfig
}

export interface AppState {
  schemaVersion: number
  scenarios: Scenario[]
  activeScenarioId: string
  /** 1–3 scenario ids shown side-by-side in the comparison view. */
  comparisonIds: string[]
}

export const SCHEMA_VERSION = 1
