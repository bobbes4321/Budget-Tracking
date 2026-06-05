import type { AnnualBenefit, IncomeItem, RestrictedBenefit } from '../types'

export function totalNettoMonthly(income: IncomeItem[]): number {
  return income.reduce((s, i) => s + i.nettoMonthly, 0)
}

export function totalBrutoMonthly(income: IncomeItem[]): number {
  return income.reduce((s, i) => s + (i.brutoMonthly ?? 0), 0)
}

/** Net/gross ratio ("you keep X%"), or null if no bruto entered. */
export function keepRatio(income: IncomeItem[]): number | null {
  const bruto = totalBrutoMonthly(income)
  if (bruto <= 0) return null
  return totalNettoMonthly(income) / bruto
}

/** Monthly contribution of annual benefits flagged as part of the budget. */
export function smoothedAnnualBenefitsMonthly(benefits: AnnualBenefit[]): number {
  return benefits
    .filter((b) => b.treatment === 'smoothIntoBudget')
    .reduce((s, b) => s + b.annualNetAmount / 12, 0)
}

/** Total annual cash from benefits flagged as investable windfalls. */
export function investableWindfallsAnnual(benefits: AnnualBenefit[]): number {
  return benefits
    .filter((b) => b.treatment === 'investableWindfall')
    .reduce((s, b) => s + b.annualNetAmount, 0)
}

/** Total monthly value of restricted (non-cash) benefits. */
export function restrictedBenefitsMonthly(benefits: RestrictedBenefit[]): number {
  return benefits.reduce((s, b) => s + b.monthlyValue, 0)
}

/** Cash available each month for budgeting: net salary + smoothed benefits. */
export function availableMonthlyIncome(
  income: IncomeItem[],
  annualBenefits: AnnualBenefit[],
): number {
  return totalNettoMonthly(income) + smoothedAnnualBenefitsMonthly(annualBenefits)
}
