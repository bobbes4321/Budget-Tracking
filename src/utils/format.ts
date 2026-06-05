const eur0 = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const eur2 = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const eurCompact = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** €1.234 (no decimals) — for totals and large figures. */
export function formatEUR(n: number): string {
  return eur0.format(isFinite(n) ? n : 0)
}

/** €1.234,56 — for precise per-item amounts. */
export function formatEURPrecise(n: number): string {
  return eur2.format(isFinite(n) ? n : 0)
}

/** €494K — for chart axes and headline projections. */
export function formatEURCompact(n: number): string {
  return eurCompact.format(isFinite(n) ? n : 0)
}

/** 7% / 70,5% */
export function formatPct(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`.replace('.', ',')
}
