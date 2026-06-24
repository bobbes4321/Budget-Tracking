import { describe, it, expect } from 'vitest'
import type { Expense, SinkingFund } from '../types'
import { monthlyEquivalent, totalTrueMonthlyCost, categoryBreakdown } from './normalize'
import { requiredMonthly, fundProgress } from './sinkingFunds'
import {
  projectSeries,
  projectValueAt,
  requiredMonthlyContribution,
  effectiveMonthlyRate,
} from './projection'
import { pensioensparenRefund } from './belgian'
import { addMonthsISO, monthsUntil } from '../utils/dates'

const expense = (over: Partial<Expense>): Expense => ({
  id: 'x',
  name: 'e',
  amount: 0,
  frequency: { everyMonths: 1 },
  category: 'other',
  ...over,
})

describe('normalize', () => {
  it('converts a yearly €360 bill to €30/month', () => {
    expect(monthlyEquivalent(expense({ amount: 360, frequency: { everyMonths: 12 } }))).toBe(30)
  })

  it('converts quarterly €600 to €200/month', () => {
    expect(monthlyEquivalent(expense({ amount: 600, frequency: { everyMonths: 3 } }))).toBe(200)
  })

  it('sums and breaks down by category', () => {
    const expenses = [
      expense({ amount: 1000, category: 'housing' }),
      expense({ amount: 360, frequency: { everyMonths: 12 }, category: 'insurance' }),
      expense({ amount: 300, category: 'groceries' }),
    ]
    expect(totalTrueMonthlyCost(expenses)).toBe(1330)
    const breakdown = categoryBreakdown(expenses)
    expect(breakdown[0]).toEqual({ category: 'housing', total: 1000 })
    expect(breakdown.find((c) => c.category === 'insurance')?.total).toBe(30)
  })
})

describe('sinking funds', () => {
  const from = new Date(2026, 0, 1)
  it('computes €150/month for €1800 over 12 months', () => {
    const fund: SinkingFund = {
      id: 'dl',
      name: "Driver's license",
      targetCost: 1800,
      alreadySaved: 0,
      targetDate: '2027-01-01',
    }
    expect(requiredMonthly(fund, from)).toBeCloseTo(150, 5)
  })

  it('accounts for money already saved', () => {
    const fund: SinkingFund = {
      id: 'dl',
      name: "Driver's license",
      targetCost: 1800,
      alreadySaved: 600,
      targetDate: '2027-01-01',
    }
    expect(requiredMonthly(fund, from)).toBeCloseTo(100, 5)
  })

  it('addMonthsISO round-trips to exactly N months (no timezone drift)', () => {
    // Use an afternoon local time to expose any UTC-shift off-by-one.
    const afternoon = new Date(2026, 5, 4, 15, 30)
    expect(monthsUntil(addMonthsISO(12, afternoon), afternoon)).toBe(12)
    const fund: SinkingFund = { id: 'g', name: 'g', targetCost: 1800, alreadySaved: 0, targetDate: addMonthsISO(12, afternoon) }
    expect(requiredMonthly(fund, afternoon)).toBeCloseTo(150, 5)
  })

  it('projects completion months for a fixed monthly with no date', () => {
    const fund: SinkingFund = {
      id: 'f',
      name: 'Fund',
      targetCost: 1000,
      alreadySaved: 100,
      fixedMonthly: 150,
    }
    expect(fundProgress(fund, from).monthsToComplete).toBe(6)
  })
})

describe('projection', () => {
  it('compounds 12 monthly steps to the annual rate', () => {
    const r = effectiveMonthlyRate(7)
    expect(Math.pow(1 + r, 12)).toBeCloseTo(1.07, 10)
  })

  it('grows a lump sum: €10k @7% for 10y ≈ €19,672', () => {
    const point = projectValueAt(
      { monthlyContribution: 0, startingCapital: 10000, nominalReturnPct: 7, inflationPct: 0 },
      10,
    )
    expect(point.nominalGross).toBeCloseTo(10000 * Math.pow(1.07, 10), 2)
  })

  it('grows €200/mo @7% for 40y to ≈ €494k', () => {
    const point = projectValueAt(
      { monthlyContribution: 200, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0 },
      40,
    )
    expect(point.nominalGross).toBeGreaterThan(490_000)
    expect(point.nominalGross).toBeLessThan(499_000)
    expect(point.principal).toBe(200 * 480)
  })

  it('real value equals nominal when inflation is 0', () => {
    const point = projectValueAt(
      { monthlyContribution: 200, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0 },
      20,
    )
    expect(point.realGross).toBeCloseTo(point.nominalGross, 2)
  })

  it('real value is deflated by inflation', () => {
    const point = projectValueAt(
      { monthlyContribution: 200, startingCapital: 0, nominalReturnPct: 7, inflationPct: 2 },
      30,
    )
    expect(point.realGross).toBeLessThan(point.nominalGross)
    expect(point.realGross).toBeCloseTo(point.nominalGross / Math.pow(1.02, 30), 2)
  })

  it('applies capital-gains tax only to gains', () => {
    const gross = projectValueAt(
      { monthlyContribution: 100, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0 },
      20,
    )
    const taxed = projectValueAt(
      {
        monthlyContribution: 100,
        startingCapital: 0,
        nominalReturnPct: 7,
        inflationPct: 0,
        capitalGainsTaxPct: 10,
      },
      20,
    )
    const gains = gross.nominalGross - gross.principal
    expect(taxed.nominalNet).toBeCloseTo(gross.principal + gains * 0.9, 1)
  })

  it('invests an annual windfall as a yearly lump', () => {
    const point = projectValueAt(
      { monthlyContribution: 0, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0, annualContribution: 1000 },
      3,
    )
    // Lumps land at the end of years 1, 2, 3; the first two compound at 7%.
    const expected = 1000 * Math.pow(1.07, 2) + 1000 * Math.pow(1.07, 1) + 1000
    expect(point.nominalGross).toBeCloseTo(expected, 2)
    expect(point.principal).toBe(3000)
  })

  it('annual windfall lifts the projection above monthly-only', () => {
    const base = { monthlyContribution: 200, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0 }
    const withoutWindfall = projectValueAt(base, 40).nominalGross
    const withWindfall = projectValueAt({ ...base, annualContribution: 2400 }, 40).nominalGross
    expect(withWindfall).toBeGreaterThan(withoutWindfall)
  })

  it('emits one point per year plus year 0', () => {
    const series = projectSeries({
      monthlyContribution: 100,
      startingCapital: 0,
      nominalReturnPct: 7,
      inflationPct: 2,
      years: 40,
    })
    expect(series.length).toBe(41)
    expect(series[0].year).toBe(0)
    expect(series[40].year).toBe(40)
  })

  it('backward solve inverts the forward projection', () => {
    const target = projectValueAt(
      { monthlyContribution: 200, startingCapital: 0, nominalReturnPct: 7, inflationPct: 0 },
      40,
    ).nominalGross
    const required = requiredMonthlyContribution({
      targetNominal: target,
      startingCapital: 0,
      nominalReturnPct: 7,
      years: 40,
    })
    expect(required).toBeCloseTo(200, 1)
  })
})

describe('pensioensparen refund', () => {
  it('low regime: €1020 → €306 (30%)', () => {
    expect(pensioensparenRefund('low', 1020)).toBeCloseTo(306, 5)
  })
  it('caps the eligible amount', () => {
    expect(pensioensparenRefund('low', 5000)).toBeCloseTo(306, 5)
  })
  it('high regime: €1310 → €327.50 (25%)', () => {
    expect(pensioensparenRefund('high', 1310)).toBeCloseTo(327.5, 5)
  })
  it('none regime returns 0', () => {
    expect(pensioensparenRefund('none', 1000)).toBe(0)
  })
})
