import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { EXPENSE_CATEGORIES } from '../../types'
import { useActiveScenario } from '../../store/useBudgetStore'
import { computeBudget } from '../../calc/surplus'
import { categoryBreakdown } from '../../calc/normalize'
import { investableWindfallsAnnual, restrictedBenefitsMonthly } from '../../calc/income'
import { projectValueAt } from '../../calc/projection'
import { fundProgress } from '../../calc/sinkingFunds'
import { formatEUR } from '../../utils/format'
import { Card, PageHeader, Stat, SectionTitle } from '../ui/primitives'

const PIE_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#7c3aed', '#e11d48', '#0891b2', '#ea580c', '#db2777', '#65a30d', '#64748b']
const catLabel = (c: string) => EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? c

export function DashboardScreen() {
  const scenario = useActiveScenario()
  const budget = computeBudget(scenario)
  const breakdown = categoryBreakdown(scenario.expenses)
  const windfall = investableWindfallsAnnual(scenario.annualBenefits)
  const restricted = restrictedBenefitsMonthly(scenario.restrictedBenefits)

  const investMonthly = Math.max(0, budget.allocation.invest)
  const projParams = {
    monthlyContribution: investMonthly,
    startingCapital: scenario.pension.startingCapital,
    nominalReturnPct: scenario.assumptions.nominalReturnPct,
    inflationPct: scenario.assumptions.inflationPct,
    tobPct: scenario.assumptions.tobPct,
    capitalGainsTaxPct: scenario.assumptions.capitalGainsTaxPct,
  }
  const horizons = [20, 30, 40].map((y) => ({ y, v: projectValueAt(projParams, y).realNet }))

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Scenario: ${scenario.name}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Available income / mo" value={formatEUR(budget.availableIncome)} hint={restricted > 0 ? `+ ${formatEUR(restricted)}/mo restricted benefits` : undefined} />
        <Stat label="True monthly cost" value={formatEUR(budget.trueMonthlyCost)} hint={`+ ${formatEUR(budget.sinkingMonthly)}/mo to goals`} />
        <Stat label="Monthly surplus" value={formatEUR(budget.surplus)} tone={budget.surplus >= 0 ? 'positive' : 'negative'} hint={budget.surplus < 0 ? 'Spending exceeds income' : `${formatEUR(budget.allocation.invest)} to invest`} />
        <Stat label="Investable windfalls / yr" value={formatEUR(windfall)} hint="From benefits flagged as windfalls" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle>If you invest {formatEUR(investMonthly)}/mo (today's money)</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {horizons.map(({ y, v }) => (
              <div key={y} className="rounded-lg bg-brand-50 p-4 text-center">
                <div className="text-xs text-slate-500">{y} years</div>
                <div className="mt-1 text-xl font-bold text-brand-700">{formatEUR(v)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            At {scenario.assumptions.nominalReturnPct}% return, {scenario.assumptions.inflationPct}% inflation, after Belgian taxes. Adjust on Invest &amp; Project.
          </p>
        </Card>

        <Card>
          <SectionTitle>Where the money goes</SectionTitle>
          {breakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="total" nameKey="category" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [formatEUR(Number(v)), catLabel(String(n))]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1 text-sm">
                {breakdown.slice(0, 6).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {catLabel(c.category)}
                    </span>
                    <span className="font-medium text-slate-900">{formatEUR(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Add expenses to see the breakdown.</p>
          )}
        </Card>
      </div>

      {scenario.sinkingFunds.length > 0 && (
        <Card>
          <SectionTitle>Savings goals</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenario.sinkingFunds.map((fund) => {
              const p = fundProgress(fund)
              return (
                <div key={fund.id}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{fund.name}</span>
                    <span className="font-medium text-brand-600">{formatEUR(p.monthly)}/mo</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${p.pctComplete * 100}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{formatEUR(fund.alreadySaved)} / {formatEUR(fund.targetCost)}</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
