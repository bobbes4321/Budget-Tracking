import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { computeBudget } from '../../calc/surplus'
import { projectPension } from '../../calc/pension'
import { PENSIOENSPAREN } from '../../calc/belgian'
import type { PensioensparenRegime } from '../../types'
import { formatEUR } from '../../utils/format'
import { Card, PageHeader, Stat, SectionTitle } from '../ui/primitives'
import { Field, CurrencyInput, NumberInput, PercentInput, Select } from '../ui/inputs'

const regimeOptions: { value: PensioensparenRegime; label: string }[] = [
  { value: 'none', label: 'Not using pensioensparen' },
  { value: 'low', label: `Low — ${PENSIOENSPAREN.low.label}` },
  { value: 'high', label: `High — ${PENSIOENSPAREN.high.label}` },
]

export function PensionScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const p = scenario.pension
  const budget = computeBudget(scenario)
  const brokerageMonthly = Math.max(0, budget.allocation.invest)
  const proj = projectPension(p, scenario.assumptions, brokerageMonthly)

  return (
    <div>
      <PageHeader
        title="Pension"
        subtitle={`Planning for retirement at ${p.retirementAge} — that's ${proj.years} years away. Values shown in today's money.`}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionTitle>Timeline & target</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current age">
                <NumberInput value={p.currentAge} min={16} onChange={(v) => mutate((s) => { s.pension.currentAge = Math.round(v) })} />
              </Field>
              <Field label="Retirement age">
                <NumberInput value={p.retirementAge} min={p.currentAge + 1} onChange={(v) => mutate((s) => { s.pension.retirementAge = Math.round(v) })} />
              </Field>
              <Field label="Already invested">
                <CurrencyInput value={p.startingCapital} onChange={(v) => mutate((s) => { s.pension.startingCapital = v })} />
              </Field>
              <Field label="Target (today's money)">
                <CurrencyInput value={p.targetCapital ?? 0} step={10000} onChange={(v) => mutate((s) => { s.pension.targetCapital = v })} />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Pensioensparen (3rd pillar)</SectionTitle>
            <div className="space-y-3">
              <Field label="Regime">
                <Select value={p.pensioensparenRegime} options={regimeOptions} onChange={(v) => mutate((s) => { s.pension.pensioensparenRegime = v })} />
              </Field>
              <Field label="Contribution / year">
                <CurrencyInput value={p.pensioensparenAnnual} onChange={(v) => mutate((s) => { s.pension.pensioensparenAnnual = v })} />
              </Field>
              <Field label="One-off maturity tax (~age 60)">
                <PercentInput value={p.pillarEndTaxPct} onChange={(v) => mutate((s) => { s.pension.pillarEndTaxPct = v })} />
              </Field>
              <label className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Reinvest the tax refund</span>
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={p.reinvestTaxRefund} onChange={(e) => mutate((s) => { s.pension.reinvestTaxRefund = e.target.checked })} />
              </label>
              {proj.pillar.annualRefund > 0 && (
                <p className="text-xs text-brand-700">Tax refund: {formatEUR(proj.pillar.annualRefund)}/year — a guaranteed return no market beats.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Projected total at retirement" value={formatEUR(proj.totalRealNet)} hint={`${formatEUR(proj.totalNominalNet)} in future euros`} tone="positive" />
            <Stat
              label={p.targetCapital ? 'On track?' : 'Set a target above'}
              value={proj.onTrack === null ? '—' : proj.onTrack ? 'Yes ✓' : 'Short'}
              hint={proj.requiredMonthlyForTarget !== null ? `Need ${formatEUR(proj.requiredMonthlyForTarget)}/mo invested (you're at ${formatEUR(brokerageMonthly)})` : undefined}
              tone={proj.onTrack === false ? 'negative' : proj.onTrack ? 'positive' : 'neutral'}
            />
          </div>

          <Card>
            <SectionTitle>Where it comes from (today's money)</SectionTitle>
            <div className="space-y-4">
              <PotBar label="Pensioensparen (3rd pillar)" amount={proj.pillar.realNet} total={proj.totalRealNet} contributed={proj.pillar.contributedMonthly} />
              <PotBar label="Brokerage (your surplus)" amount={proj.brokerage.realNet} total={proj.totalRealNet} contributed={proj.brokerage.contributedMonthly} />
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
              Brokerage contribution comes from your monthly invest allocation. Adjust it on the Invest &amp; Project tab.
              The required-monthly figure is gross of tax — treat it as a floor.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PotBar({ label, amount, total, contributed }: { label: string; amount: number; total: number; contributed: number }) {
  const pct = total > 0 ? (amount / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label} <span className="text-xs text-slate-400">· {formatEUR(contributed)}/mo</span></span>
        <span className="font-semibold text-slate-900">{formatEUR(amount)}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
