import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { computeBudget } from '../../calc/surplus'
import { investableWindfallsAnnual } from '../../calc/income'
import { projectSeries, projectValueAt, type ProjectionPoint } from '../../calc/projection'
import { formatEUR, formatEURCompact, formatPct } from '../../utils/format'
import { Card, PageHeader, Stat } from '../ui/primitives'
import { Field, PercentInput, CurrencyInput } from '../ui/inputs'
import { Slider } from '../ui/Slider'

type ValueKey = keyof Pick<ProjectionPoint, 'realNet' | 'realGross' | 'nominalNet' | 'nominalGross'>

export function InvestProjectScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const budget = computeBudget(scenario)
  const a = scenario.assumptions

  const [contribution, setContribution] = useState(() => Math.round(Math.max(0, budget.allocation.invest)))
  const [viewReal, setViewReal] = useState(true)
  const [applyTax, setApplyTax] = useState(true)

  // Starting lump sum is the persisted, per-scenario "already invested" amount —
  // shared with the Pension tab so every projection stays consistent.
  const startingCapital = scenario.pension.startingCapital
  const setStartingCapital = (v: number) => mutate((s) => { s.pension.startingCapital = Math.max(0, v) })
  const windfall = investableWindfallsAnnual(scenario.annualBenefits)

  const valueKey: ValueKey = viewReal
    ? applyTax ? 'realNet' : 'realGross'
    : applyTax ? 'nominalNet' : 'nominalGross'

  const params = useMemo(() => ({
    monthlyContribution: contribution,
    annualContribution: windfall,
    startingCapital,
    nominalReturnPct: a.nominalReturnPct,
    inflationPct: a.inflationPct,
    tobPct: applyTax ? a.tobPct : 0,
    capitalGainsTaxPct: applyTax ? a.capitalGainsTaxPct : 0,
  }), [contribution, windfall, startingCapital, a.nominalReturnPct, a.inflationPct, a.tobPct, a.capitalGainsTaxPct, applyTax])

  const series = useMemo(() => projectSeries({ ...params, years: 40 }), [params])

  const horizons = [20, 30, 40].map((y) => ({ years: y, point: projectValueAt(params, y) }))

  return (
    <div>
      <PageHeader
        title="Invest & Project"
        subtitle="Play with the numbers. Default view is today's money (real), net of Belgian taxes."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Controls */}
        <div className="space-y-5">
          <Card>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-600">Invest / month</span>
              <span className="text-lg font-bold text-brand-600">{formatEUR(contribution)}</span>
            </div>
            <Slider value={contribution} min={0} max={3000} step={10} onChange={setContribution} />
            <button className="mt-2 text-xs text-slate-500 underline hover:text-slate-700" onClick={() => setContribution(Math.round(Math.max(0, budget.allocation.invest)))}>
              Reset to budget amount ({formatEUR(budget.allocation.invest)})
            </button>
          </Card>

          <Card>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-600">Starting lump sum</span>
              <span className="text-lg font-bold text-slate-900">{formatEUR(startingCapital)}</span>
            </div>
            <Slider value={Math.min(startingCapital, 100000)} min={0} max={100000} step={500} onChange={setStartingCapital} />
            <div className="mt-3">
              <CurrencyInput value={startingCapital} step={1000} onChange={setStartingCapital} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Saved with this scenario (same as “Already invested” on the Pension tab). Type any amount; the slider tops out at €100K.
            </p>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expected return (nominal)">
                <PercentInput value={a.nominalReturnPct} onChange={(v) => mutate((s) => { s.assumptions.nominalReturnPct = v })} />
              </Field>
              <Field label="Inflation">
                <PercentInput value={a.inflationPct} onChange={(v) => mutate((s) => { s.assumptions.inflationPct = v })} />
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-400">Real return ≈ {formatPct(((1 + a.nominalReturnPct / 100) / (1 + a.inflationPct / 100) - 1) * 100, 1)}/yr after inflation.</p>
          </Card>

          <Card>
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Show in today's money (real)</span>
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={viewReal} onChange={(e) => setViewReal(e.target.checked)} />
            </label>
            <label className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">Apply Belgian taxes (TOB + CGT)</span>
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />
            </label>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <div className="mb-2 text-sm font-semibold text-slate-600">
            Projected value over 40 years · {viewReal ? "today's money" : 'future euros'}{applyTax ? ', after tax' : ', before tax'}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16744f" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16744f" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} tickFormatter={(y) => `${y}y`} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatEURCompact(v)} width={70} />
                <Tooltip
                  formatter={(v, name) => [formatEUR(Number(v)), String(name) === valueKey ? 'Value' : 'Contributed']}
                  labelFormatter={(y) => `After ${y} years`}
                />
                <ReferenceLine x={20} stroke="#94a3b8" strokeDasharray="4 4" />
                <ReferenceLine x={30} stroke="#94a3b8" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="principal" stroke="#94a3b8" fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey={valueKey} stroke="#16744f" fill="url(#growth)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Green = portfolio value · grey = money you contributed. The gap is growth.
            {windfall > 0 && ` Includes ${formatEUR(windfall)}/yr of investable windfalls, invested as a yearly lump.`}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {horizons.map(({ years, point }) => (
          <Stat
            key={years}
            label={`In ${years} years`}
            value={formatEUR(point[valueKey])}
            hint={`Contributed ${formatEUR(point.principal)} · growth ${formatEUR(point[valueKey] - point.principal)}`}
            tone="positive"
          />
        ))}
      </div>
    </div>
  )
}
