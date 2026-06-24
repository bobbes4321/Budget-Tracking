import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useBudgetStore } from '../../store/useBudgetStore'
import type { Scenario } from '../../types'
import { computeBudget } from '../../calc/surplus'
import { investableWindfallsAnnual } from '../../calc/income'
import { projectSeries, projectValueAt } from '../../calc/projection'
import { formatEUR, formatEURCompact } from '../../utils/format'
import { Card, PageHeader, Button, SectionTitle } from '../ui/primitives'

const LINE_COLORS = ['#16744f', '#0ea5e9', '#f59e0b']

function investMonthlyOf(s: Scenario): number {
  return Math.max(0, computeBudget(s).allocation.invest)
}
function projParamsOf(s: Scenario) {
  return {
    monthlyContribution: investMonthlyOf(s),
    annualContribution: investableWindfallsAnnual(s.annualBenefits),
    startingCapital: s.pension.startingCapital,
    nominalReturnPct: s.assumptions.nominalReturnPct,
    inflationPct: s.assumptions.inflationPct,
    tobPct: s.assumptions.tobPct,
    capitalGainsTaxPct: s.assumptions.capitalGainsTaxPct,
  }
}

export function ScenariosScreen() {
  const { scenarios, activeScenarioId, comparisonIds } = useBudgetStore()
  const setActive = useBudgetStore((s) => s.setActiveScenario)
  const rename = useBudgetStore((s) => s.renameScenario)
  const duplicate = useBudgetStore((s) => s.duplicateActiveScenario)
  const addScenario = useBudgetStore((s) => s.addScenario)
  const remove = useBudgetStore((s) => s.deleteScenario)
  const toggleCompare = useBudgetStore((s) => s.toggleComparison)
  const move = useBudgetStore((s) => s.moveScenario)

  const compared = scenarios.filter((s) => comparisonIds.includes(s.id))

  // Build merged chart data: one row per year, one key per compared scenario.
  const chartData = Array.from({ length: 41 }, (_, year) => {
    const row: Record<string, number> = { year }
    compared.forEach((s) => {
      const series = projectSeries({ ...projParamsOf(s), years: 40 })
      row[s.name] = Math.round(series[year]?.realNet ?? 0)
    })
    return row
  })

  return (
    <div>
      <PageHeader title="Scenarios" subtitle="Save variants and compare them side by side. Pick up to 3 to chart." />

      <Card className="mb-6">
        <div className="space-y-2">
          {scenarios.map((s, i) => {
            const budget = computeBudget(s)
            return (
              <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${s.id === activeScenarioId ? 'border-brand-300 bg-brand-50' : 'border-slate-200'}`}>
                <div className="flex flex-col">
                  <Button variant="ghost" className="px-1.5 py-0 leading-none" disabled={i === 0} onClick={() => move(s.id, 'up')} title="Move up">▲</Button>
                  <Button variant="ghost" className="px-1.5 py-0 leading-none" disabled={i === scenarios.length - 1} onClick={() => move(s.id, 'down')} title="Move down">▼</Button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={comparisonIds.includes(s.id)} onChange={() => toggleCompare(s.id)} />
                  <span className="text-xs text-slate-400">compare</span>
                </label>
                <input
                  className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-900 hover:border-slate-200 focus:border-brand-400 focus:bg-white focus:outline-none"
                  value={s.name}
                  onChange={(e) => rename(s.id, e.target.value)}
                />
                <span className="text-xs text-slate-500">surplus {formatEUR(budget.surplus)} · invest {formatEUR(budget.allocation.invest)}/mo</span>
                {s.id === activeScenarioId ? (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">active</span>
                ) : (
                  <Button variant="secondary" onClick={() => setActive(s.id)}>Make active</Button>
                )}
                <Button variant="ghost" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => addScenario()}>+ New scenario</Button>
          <Button variant="secondary" onClick={() => duplicate()}>Duplicate active</Button>
        </div>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <SectionTitle>Comparison</SectionTitle>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-medium">Scenario</th>
              <th className="pb-2 pr-3 text-right font-medium">Surplus / mo</th>
              <th className="pb-2 pr-3 text-right font-medium">Invest / mo</th>
              <th className="pb-2 pr-3 text-right font-medium">In 20y</th>
              <th className="pb-2 pr-3 text-right font-medium">In 40y</th>
            </tr>
          </thead>
          <tbody>
            {compared.map((s, i) => {
              const budget = computeBudget(s)
              const params = projParamsOf(s)
              return (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
                    {s.name}
                  </td>
                  <td className="py-2 pr-3 text-right">{formatEUR(budget.surplus)}</td>
                  <td className="py-2 pr-3 text-right">{formatEUR(budget.allocation.invest)}</td>
                  <td className="py-2 pr-3 text-right">{formatEUR(projectValueAt(params, 20).realNet)}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-brand-700">{formatEUR(projectValueAt(params, 40).realNet)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Projected value (today's money, after tax)</SectionTitle>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} tickFormatter={(y) => `${y}y`} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatEURCompact(v)} width={70} />
              <Tooltip formatter={(v) => formatEUR(Number(v))} labelFormatter={(y) => `After ${y} years`} />
              <Legend />
              {compared.map((s, i) => (
                <Line key={s.id} type="monotone" dataKey={s.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
