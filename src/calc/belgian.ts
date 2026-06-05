// ============================================================================
// Belgium-specific tax constants. These are INDEXED and change yearly —
// surface them in the UI as editable, stamped with the tax year, so the user
// reviews them rather than trusting hardcoded values. Not financial advice.
// ============================================================================

import type { PensioensparenRegime } from '../types'

export const BELGIAN_TAX_YEAR = 2025

/**
 * Pensioensparen (3rd pillar) regimes.
 * - low:  contribute up to `cap`, get `refundRate`% back as a tax reduction.
 * - high: higher cap but a lower refund rate (only worth it above the low cap).
 * Figures are indexed yearly — verify for the current tax year.
 */
export const PENSIOENSPAREN: Record<
  Exclude<PensioensparenRegime, 'none'>,
  { cap: number; refundRatePct: number; label: string }
> = {
  low: { cap: 1020, refundRatePct: 30, label: '€1 020 @ 30% reduction' },
  high: { cap: 1310, refundRatePct: 25, label: '€1 310 @ 25% reduction' },
}

/** Annual tax refund from pensioensparen for a given regime and contribution. */
export function pensioensparenRefund(
  regime: PensioensparenRegime,
  annualContribution: number,
): number {
  if (regime === 'none') return 0
  const { cap, refundRatePct } = PENSIOENSPAREN[regime]
  const eligible = Math.min(annualContribution, cap)
  return eligible * (refundRatePct / 100)
}

/** Default tax/return assumptions for a fresh scenario. */
export const DEFAULT_ASSUMPTIONS = {
  nominalReturnPct: 7,
  inflationPct: 2,
  tobPct: 0.12, // beurstaks / TOB per accumulating-ETF purchase
  capitalGainsTaxPct: 10, // new solidarity CGT on financial assets — VERIFY current law
  reyndersTaxPct: 0, // 0 for all-equity portfolios
}
