/**
 * Whole months from `from` until `targetISO` (YYYY-MM-DD).
 * Returns a value that can be negative if the target is in the past.
 */
export function monthsUntil(targetISO: string, from: Date = new Date()): number {
  const target = new Date(targetISO + 'T00:00:00')
  let months =
    (target.getFullYear() - from.getFullYear()) * 12 +
    (target.getMonth() - from.getMonth())
  if (target.getDate() < from.getDate()) months -= 1
  return months
}

/** Format a Date as a local YYYY-MM-DD (avoids the UTC shift of toISOString). */
function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO date (YYYY-MM-DD) that is `months` after `from`. */
export function addMonthsISO(months: number, from: Date = new Date()): string {
  return toLocalISO(new Date(from.getFullYear(), from.getMonth() + months, from.getDate()))
}

export function todayISO(from: Date = new Date()): string {
  return toLocalISO(from)
}
