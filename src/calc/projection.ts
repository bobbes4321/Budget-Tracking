// ============================================================================
// Compound-growth projections. Monthly compounding using the EFFECTIVE monthly
// rate, so "7%" means 7% effective per year. Produces both nominal and real
// (today's-money) values, gross and net of capital-gains tax.
// ============================================================================

export interface ProjectionParams {
  monthlyContribution: number
  startingCapital: number
  nominalReturnPct: number
  inflationPct: number
  years: number
  /** Per-contribution transaction-tax drag (TOB), as a percentage. */
  tobPct?: number
  /** Capital-gains tax applied to gains at the horizon, as a percentage. */
  capitalGainsTaxPct?: number
  /** Lump sum invested once at each completed year (e.g. an annual windfall/bonus). */
  annualContribution?: number
}

export interface ProjectionPoint {
  year: number
  /** Money actually contributed from pocket (starting capital + deposits). */
  principal: number
  nominalGross: number
  nominalNet: number
  realGross: number
  realNet: number
}

/** Effective monthly rate such that 12 months compounds to the annual rate. */
export function effectiveMonthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1
}

function applyCgt(balance: number, principal: number, cgt: number): number {
  if (cgt <= 0 || balance <= principal) return balance
  return principal + (balance - principal) * (1 - cgt)
}

/**
 * Monthly simulation, emitting one point per year (plus year 0).
 * Contributions are made at the end of each month.
 */
export function projectSeries(p: ProjectionParams): ProjectionPoint[] {
  const rMonthly = effectiveMonthlyRate(p.nominalReturnPct)
  const inflAnnual = p.inflationPct / 100
  const tob = (p.tobPct ?? 0) / 100
  const cgt = (p.capitalGainsTaxPct ?? 0) / 100
  const effContribution = p.monthlyContribution * (1 - tob)
  const annualContribution = p.annualContribution ?? 0
  const effAnnual = annualContribution * (1 - tob)
  const totalMonths = Math.round(p.years * 12)

  let balance = p.startingCapital
  let principal = p.startingCapital
  const points: ProjectionPoint[] = []

  const pushPoint = (month: number) => {
    const yearsElapsed = month / 12
    const deflator = Math.pow(1 + inflAnnual, yearsElapsed)
    const nominalNet = applyCgt(balance, principal, cgt)
    points.push({
      year: Math.round(yearsElapsed),
      principal,
      nominalGross: balance,
      nominalNet,
      realGross: balance / deflator,
      realNet: nominalNet / deflator,
    })
  }

  pushPoint(0)
  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + rMonthly) + effContribution
    principal += p.monthlyContribution
    if (m % 12 === 0) {
      balance += effAnnual
      principal += annualContribution
    }
    if (m % 12 === 0 || m === totalMonths) pushPoint(m)
  }
  return points
}

/** Final projected point at a given horizon (e.g. 20/30/40 years). */
export function projectValueAt(
  p: Omit<ProjectionParams, 'years'>,
  years: number,
): ProjectionPoint {
  const series = projectSeries({ ...p, years })
  return series[series.length - 1]
}

/**
 * Required monthly contribution to reach `targetNominal` at the horizon,
 * gross of tax. Solves the future-value-of-annuity formula for the payment.
 */
export function requiredMonthlyContribution(args: {
  targetNominal: number
  startingCapital: number
  nominalReturnPct: number
  years: number
}): number {
  const r = effectiveMonthlyRate(args.nominalReturnPct)
  const n = Math.round(args.years * 12)
  const growth = Math.pow(1 + r, n)
  const fromStart = args.startingCapital * growth
  const needed = args.targetNominal - fromStart
  if (needed <= 0) return 0
  if (r === 0) return needed / n
  return (needed * r) / (growth - 1)
}

/** Convert a target expressed in today's money to nominal euros at the horizon. */
export function realToNominal(realAmount: number, inflationPct: number, years: number): number {
  return realAmount * Math.pow(1 + inflationPct / 100, years)
}
