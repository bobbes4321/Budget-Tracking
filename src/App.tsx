import { useState } from 'react'
import { useBudgetStore } from './store/useBudgetStore'
import { DashboardScreen } from './components/screens/Dashboard'
import { IncomeScreen } from './components/screens/Income'
import { ExpensesScreen } from './components/screens/Expenses'
import { GoalsScreen } from './components/screens/Goals'
import { InvestProjectScreen } from './components/screens/InvestProject'
import { PensionScreen } from './components/screens/Pension'
import { ScenariosScreen } from './components/screens/Scenarios'
import { SettingsScreen } from './components/screens/Settings'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Screen: DashboardScreen },
  { id: 'income', label: 'Income', Screen: IncomeScreen },
  { id: 'expenses', label: 'Expenses', Screen: ExpensesScreen },
  { id: 'goals', label: 'Goals', Screen: GoalsScreen },
  { id: 'invest', label: 'Invest & Project', Screen: InvestProjectScreen },
  { id: 'pension', label: 'Pension', Screen: PensionScreen },
  { id: 'scenarios', label: 'Scenarios', Screen: ScenariosScreen },
  { id: 'settings', label: 'Settings', Screen: SettingsScreen },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const scenarios = useBudgetStore((s) => s.scenarios)
  const activeScenarioId = useBudgetStore((s) => s.activeScenarioId)
  const setActiveScenario = useBudgetStore((s) => s.setActiveScenario)

  const Screen = TABS.find((t) => t.id === tab)!.Screen

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-700">€</span>
            <span className="font-semibold text-slate-900">Budget &amp; Invest</span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Scenario</span>
            <select
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-medium text-slate-800 outline-none focus:border-brand-500"
              value={activeScenarioId}
              onChange={(e) => setActiveScenario(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Screen />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-400">
        Personal estimates only — not financial or tax advice. Data stays in your browser.
      </footer>
    </div>
  )
}

export default App
