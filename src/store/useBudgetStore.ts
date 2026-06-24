import { create } from 'zustand'
import type { AppState, Scenario } from '../types'
import { loadState, saveState } from '../persistence/storage'
import { makeDefaultScenario } from './defaults'
import { uid } from '../utils/id'

interface BudgetStore extends AppState {
  /** Replace the whole state (used by import). */
  replaceState: (state: AppState) => void
  /** Mutate a deep clone of the active scenario, then commit it. */
  mutateActive: (fn: (draft: Scenario) => void) => void
  setActiveScenario: (id: string) => void
  addScenario: (name?: string) => void
  duplicateActiveScenario: (name?: string) => void
  renameScenario: (id: string, name: string) => void
  deleteScenario: (id: string) => void
  toggleComparison: (id: string) => void
  /** Move a scenario one position up or down in the ordering. */
  moveScenario: (id: string, direction: 'up' | 'down') => void
}

function cloneScenarioWithNewIds(s: Scenario, name: string): Scenario {
  const c = structuredClone(s)
  c.id = uid()
  c.name = name
  c.income.forEach((i) => (i.id = uid()))
  c.annualBenefits.forEach((b) => (b.id = uid()))
  c.restrictedBenefits.forEach((b) => (b.id = uid()))
  c.expenses.forEach((e) => (e.id = uid()))
  c.sinkingFunds.forEach((f) => (f.id = uid()))
  return c
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  ...loadState(),

  replaceState: (state) => set(() => ({ ...state })),

  mutateActive: (fn) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => {
        if (s.id !== state.activeScenarioId) return s
        const clone = structuredClone(s)
        fn(clone)
        return clone
      }),
    })),

  setActiveScenario: (id) => set(() => ({ activeScenarioId: id })),

  addScenario: (name) =>
    set((state) => {
      const scenario = makeDefaultScenario(name ?? `Scenario ${state.scenarios.length + 1}`)
      return {
        scenarios: [...state.scenarios, scenario],
        activeScenarioId: scenario.id,
      }
    }),

  duplicateActiveScenario: (name) =>
    set((state) => {
      const active = state.scenarios.find((s) => s.id === state.activeScenarioId)
      if (!active) return {}
      const copy = cloneScenarioWithNewIds(active, name ?? `${active.name} (copy)`)
      return {
        scenarios: [...state.scenarios, copy],
        activeScenarioId: copy.id,
      }
    }),

  renameScenario: (id, name) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, name } : s)),
    })),

  deleteScenario: (id) =>
    set((state) => {
      if (state.scenarios.length <= 1) return {} // keep at least one
      const scenarios = state.scenarios.filter((s) => s.id !== id)
      const activeScenarioId =
        state.activeScenarioId === id ? scenarios[0].id : state.activeScenarioId
      const comparisonIds = state.comparisonIds.filter((c) => c !== id)
      return {
        scenarios,
        activeScenarioId,
        comparisonIds: comparisonIds.length ? comparisonIds : [activeScenarioId],
      }
    }),

  moveScenario: (id, direction) =>
    set((state) => {
      const index = state.scenarios.findIndex((s) => s.id === id)
      if (index === -1) return {}
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= state.scenarios.length) return {}
      const scenarios = [...state.scenarios]
      ;[scenarios[index], scenarios[target]] = [scenarios[target], scenarios[index]]
      return { scenarios }
    }),

  toggleComparison: (id) =>
    set((state) => {
      const has = state.comparisonIds.includes(id)
      let comparisonIds = has
        ? state.comparisonIds.filter((c) => c !== id)
        : [...state.comparisonIds, id].slice(-3) // cap at 3
      if (comparisonIds.length === 0) comparisonIds = [id]
      return { comparisonIds }
    }),
}))

/** Persist on every change. */
useBudgetStore.subscribe((state) => {
  const { schemaVersion, scenarios, activeScenarioId, comparisonIds } = state
  saveState({ schemaVersion, scenarios, activeScenarioId, comparisonIds })
})

/** Convenience hook: the currently active scenario. */
export function useActiveScenario(): Scenario {
  return useBudgetStore(
    (s) => s.scenarios.find((sc) => sc.id === s.activeScenarioId) ?? s.scenarios[0],
  )
}
