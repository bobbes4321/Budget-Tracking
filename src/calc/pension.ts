// ============================================================================
// Pension planning. Two pots:
//   1. Pensioensparen (3rd pillar): tax-advantaged, optional refund reinvest,
//      a one-off "end tax" at maturity instead of capital-gains tax.
//   2. Brokerage: regular investing of the surplus, subject to TOB + CGT.
// Targets entered by the user are treated as TODAY'S MONEY (real) and
// converted to nominal for the math.
// ============================================================================

import type { Assumptions, PensionConfig } from '../types'
import { pensioensparenRefund } from './belgian'
import { projectValueAt, requiredMonthlyContribution, realToNominal } from './projection'

export interface PotResult {
  contributedMonthly: number
  nominalNet: number
  realNet: number
}

export interface PensionProjection {
  years: number
  pillar: PotResult & { annualRefund: number }
  brokerage: PotResult
  totalNominalNet: number
  totalRealNet: number
  /** Required brokerage monthly to reach the (real) target, or null if none set. */
  requiredMonthlyForTarget: number | null
  /** Whether the current brokerage contribution meets the target, or null. */
  onTrack: boolean | null
}

function deflate(nominal: number, inflationPct: number, years: number): number {
  return nominal / Math.pow(1 + inflationPct / 100, years)
}

export function projectPension(
  pension: PensionConfig,
  assumptions: Assumptions,
  brokerageMonthly: number,
): PensionProjection {
  const years = Math.max(0, pension.retirementAge - pension.currentAge)
  const { nominalReturnPct, inflationPct, tobPct, capitalGainsTaxPct } = assumptions

  // --- 3rd pillar (pensioensparen) ---
  const annualRefund = pensioensparenRefund(
    pension.pensioensparenRegime,
    pension.pensioensparenAnnual,
  )
  const pillarMonthly =
    pension.pensioensparenAnnual / 12 +
    (pension.reinvestTaxRefund ? annualRefund / 12 : 0)

  const pillarPoint = projectValueAt(
    {
      monthlyContribution: pillarMonthly,
      startingCapital: 0,
      nominalReturnPct,
      inflationPct,
      tobPct: 0,
      capitalGainsTaxPct: 0, // pillar uses its own end tax, not CGT
    },
    years,
  )
  const pillarNominalNet = pillarPoint.nominalGross * (1 - pension.pillarEndTaxPct / 100)
  const pillar = {
    contributedMonthly: pillarMonthly,
    nominalNet: pillarNominalNet,
    realNet: deflate(pillarNominalNet, inflationPct, years),
    annualRefund,
  }

  // --- Brokerage pot ---
  const brokeragePoint = projectValueAt(
    {
      monthlyContribution: brokerageMonthly,
      startingCapital: pension.startingCapital,
      nominalReturnPct,
      inflationPct,
      tobPct,
      capitalGainsTaxPct,
    },
    years,
  )
  const brokerage = {
    contributedMonthly: brokerageMonthly,
    nominalNet: brokeragePoint.nominalNet,
    realNet: brokeragePoint.realNet,
  }

  // --- Backward solve against a real target ---
  let requiredMonthlyForTarget: number | null = null
  let onTrack: boolean | null = null
  if (pension.targetCapital && pension.targetCapital > 0) {
    const targetNominal = realToNominal(pension.targetCapital, inflationPct, years)
    const gap = Math.max(0, targetNominal - pillar.nominalNet)
    requiredMonthlyForTarget = requiredMonthlyContribution({
      targetNominal: gap,
      startingCapital: pension.startingCapital,
      nominalReturnPct,
      years,
    })
    onTrack = brokerageMonthly >= requiredMonthlyForTarget
  }

  return {
    years,
    pillar,
    brokerage,
    totalNominalNet: pillar.nominalNet + brokerage.nominalNet,
    totalRealNet: pillar.realNet + brokerage.realNet,
    requiredMonthlyForTarget,
    onTrack,
  }
}
