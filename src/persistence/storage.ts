import type { AppState } from '../types'
import { SCHEMA_VERSION } from '../types'
import { makeDefaultState } from '../store/defaults'

const STORAGE_KEY = 'budgeting-app:state'

/** Load persisted state, falling back to the seeded default. */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDefaultState()
    const parsed = JSON.parse(raw) as AppState
    return migrate(parsed)
  } catch {
    return makeDefaultState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — fail silently; export remains available.
  }
}

/** Forward-migrate older persisted shapes. Currently a passthrough. */
function migrate(state: AppState): AppState {
  if (!state || typeof state !== 'object' || !Array.isArray(state.scenarios)) {
    return makeDefaultState()
  }
  if (state.scenarios.length === 0) return makeDefaultState()
  // Ensure active/comparison ids are valid.
  const ids = new Set(state.scenarios.map((s) => s.id))
  if (!ids.has(state.activeScenarioId)) {
    state.activeScenarioId = state.scenarios[0].id
  }
  state.comparisonIds = (state.comparisonIds ?? []).filter((id) => ids.has(id))
  if (state.comparisonIds.length === 0) state.comparisonIds = [state.activeScenarioId]
  state.schemaVersion = SCHEMA_VERSION
  return state
}

/** Download the current state as a JSON backup file. */
export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `budget-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Parse and validate an imported JSON backup. Throws on invalid shape. */
export function parseImportedState(json: string): AppState {
  const parsed = JSON.parse(json) as AppState
  if (!parsed || !Array.isArray(parsed.scenarios) || parsed.scenarios.length === 0) {
    throw new Error('This file does not look like a valid budget backup.')
  }
  return migrate(parsed)
}
