import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../types'
import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { monthlyEquivalent, totalTrueMonthlyCost, categoryBreakdown } from '../../calc/normalize'
import { formatEUR, formatEURPrecise } from '../../utils/format'
import { uid } from '../../utils/id'
import { Card, PageHeader, Button } from '../ui/primitives'
import { TextInput, CurrencyInput, Select, FrequencyPicker } from '../ui/inputs'

const categoryLabel = (c: ExpenseCategory) =>
  EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? c

export function ExpensesScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const total = totalTrueMonthlyCost(scenario.expenses)
  const breakdown = categoryBreakdown(scenario.expenses)

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Every cost — monthly or irregular — normalized to its true monthly equivalent."
      />

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Amount</th>
              <th className="pb-2 pr-3 font-medium">Frequency</th>
              <th className="pb-2 pr-3 font-medium">Category</th>
              <th className="pb-2 pr-3 font-medium">Variable</th>
              <th className="pb-2 pr-3 text-right font-medium">€ / month</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {scenario.expenses.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 align-middle">
                <td className="py-2 pr-3"><TextInput value={e.name} onChange={(v) => mutate((s) => { const i = s.expenses.find((x) => x.id === e.id); if (i) i.name = v })} /></td>
                <td className="py-2 pr-3 w-32"><CurrencyInput value={e.amount} onChange={(v) => mutate((s) => { const i = s.expenses.find((x) => x.id === e.id); if (i) i.amount = v })} /></td>
                <td className="py-2 pr-3"><FrequencyPicker value={e.frequency} onChange={(f) => mutate((s) => { const i = s.expenses.find((x) => x.id === e.id); if (i) i.frequency = f })} /></td>
                <td className="py-2 pr-3 w-44"><Select value={e.category} options={EXPENSE_CATEGORIES} onChange={(v) => mutate((s) => { const i = s.expenses.find((x) => x.id === e.id); if (i) i.category = v })} /></td>
                <td className="py-2 pr-3 text-center">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!e.isVariableAllowance} onChange={(ev) => mutate((s) => { const i = s.expenses.find((x) => x.id === e.id); if (i) i.isVariableAllowance = ev.target.checked })} />
                </td>
                <td className="py-2 pr-3 text-right font-medium text-slate-900">{formatEURPrecise(monthlyEquivalent(e))}</td>
                <td className="py-2 text-right"><Button variant="danger" onClick={() => mutate((s) => { s.expenses = s.expenses.filter((x) => x.id !== e.id) })}>✕</Button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-3 text-right text-sm font-semibold text-slate-500">True monthly cost</td>
              <td className="pt-3 text-right text-lg font-bold text-slate-900">{formatEUR(total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => mutate((s) => { s.expenses.push({ id: uid(), name: 'New expense', amount: 0, frequency: { everyMonths: 1 }, category: 'other' }) })}>+ Add expense</Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">By category (monthly)</h2>
        <div className="space-y-2">
          {breakdown.map((c) => (
            <div key={c.category}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{categoryLabel(c.category)}</span>
                <span className="font-medium text-slate-900">{formatEUR(c.total)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${total > 0 ? (c.total / total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
          {breakdown.length === 0 && <p className="text-sm text-slate-400">No expenses yet.</p>}
        </div>
      </Card>
    </div>
  )
}
