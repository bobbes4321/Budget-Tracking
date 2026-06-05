import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { fundProgress, totalSinkingMonthly } from '../../calc/sinkingFunds'
import { formatEUR, formatEURPrecise } from '../../utils/format'
import { uid } from '../../utils/id'
import { addMonthsISO } from '../../utils/dates'
import { Card, PageHeader, Button } from '../ui/primitives'
import { Field, TextInput, CurrencyInput } from '../ui/inputs'

export function GoalsScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const totalMonthly = totalSinkingMonthly(scenario.sinkingFunds)

  return (
    <div>
      <PageHeader
        title="Goals · Sinking funds"
        subtitle="Save up for big one-off expenses. This money belongs in cash/savings, not invested — the horizon is too short."
      />

      <div className="mb-6 grid gap-4">
        {scenario.sinkingFunds.map((fund) => {
          const p = fundProgress(fund)
          return (
            <Card key={fund.id}>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <TextInput value={fund.name} onChange={(v) => mutate((s) => { const f = s.sinkingFunds.find((x) => x.id === fund.id); if (f) f.name = v })} />
                  </Field>
                  <Field label="Target cost">
                    <CurrencyInput value={fund.targetCost} onChange={(v) => mutate((s) => { const f = s.sinkingFunds.find((x) => x.id === fund.id); if (f) f.targetCost = v })} />
                  </Field>
                  <Field label="Already saved">
                    <CurrencyInput value={fund.alreadySaved} onChange={(v) => mutate((s) => { const f = s.sinkingFunds.find((x) => x.id === fund.id); if (f) f.alreadySaved = v })} />
                  </Field>
                  {fund.targetDate !== undefined ? (
                    <Field label="Target date">
                      <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={fund.targetDate} onChange={(e) => mutate((s) => { const f = s.sinkingFunds.find((x) => x.id === fund.id); if (f) f.targetDate = e.target.value })} />
                    </Field>
                  ) : (
                    <Field label="Fixed amount / month">
                      <CurrencyInput value={fund.fixedMonthly ?? 0} onChange={(v) => mutate((s) => { const f = s.sinkingFunds.find((x) => x.id === fund.id); if (f) f.fixedMonthly = v })} />
                    </Field>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between gap-2 border-l border-slate-100 pl-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Set aside</div>
                    <div className="text-2xl font-bold text-brand-600">{formatEURPrecise(p.monthly)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                  </div>
                  <button
                    className="text-xs text-slate-500 underline hover:text-slate-700"
                    onClick={() => mutate((s) => {
                      const f = s.sinkingFunds.find((x) => x.id === fund.id)
                      if (!f) return
                      if (f.targetDate !== undefined) { f.targetDate = undefined; f.fixedMonthly = f.fixedMonthly ?? p.monthly }
                      else { f.targetDate = addMonthsISO(12); f.fixedMonthly = undefined }
                    })}
                  >
                    {fund.targetDate !== undefined ? 'Use fixed monthly instead' : 'Use a target date instead'}
                  </button>
                  <Button variant="danger" onClick={() => mutate((s) => { s.sinkingFunds = s.sinkingFunds.filter((x) => x.id !== fund.id) })}>Remove</Button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{formatEUR(fund.alreadySaved)} of {formatEUR(fund.targetCost)}</span>
                  <span>
                    {p.monthsToComplete !== null
                      ? `~${p.monthsToComplete} months to go`
                      : p.remaining === 0
                        ? 'Fully funded 🎉'
                        : `${Math.round(p.pctComplete * 100)}% funded`}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${p.pctComplete * 100}%` }} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => mutate((s) => { s.sinkingFunds.push({ id: uid(), name: 'New goal', targetCost: 1000, alreadySaved: 0, targetDate: addMonthsISO(12) }) })}>+ Add goal</Button>
        <div className="text-sm text-slate-500">Total set aside: <strong className="text-slate-900">{formatEUR(totalMonthly)}/mo</strong></div>
      </div>
    </div>
  )
}
