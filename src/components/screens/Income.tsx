import { EXPENSE_CATEGORIES, type AnnualBenefitTreatment, type ExpenseCategory } from '../../types'
import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { keepRatio, totalNettoMonthly } from '../../calc/income'
import { formatEUR, formatPct } from '../../utils/format'
import { uid } from '../../utils/id'
import { Card, PageHeader, SectionTitle, Button } from '../ui/primitives'
import { Field, TextInput, CurrencyInput, Select } from '../ui/inputs'

const treatmentOptions: { value: AnnualBenefitTreatment; label: string }[] = [
  { value: 'smoothIntoBudget', label: 'Smooth into monthly budget' },
  { value: 'investableWindfall', label: 'Treat as investable windfall' },
]

const offsetOptions: { value: ExpenseCategory | ''; label: string }[] = [
  { value: '', label: '— none —' },
  ...EXPENSE_CATEGORIES,
]

export function IncomeScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const ratio = keepRatio(scenario.income)

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle="Your net salary is what you budget against. Gross is reference only."
      />

      <div className="space-y-8">
        <section>
          <SectionTitle>Salary & other income</SectionTitle>
          <Card>
            <div className="space-y-3">
              {scenario.income.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                  <Field label="Name">
                    <TextInput value={item.name} onChange={(v) => mutate((s) => { const i = s.income.find((x) => x.id === item.id); if (i) i.name = v })} />
                  </Field>
                  <Field label="Net / month">
                    <CurrencyInput value={item.nettoMonthly} onChange={(v) => mutate((s) => { const i = s.income.find((x) => x.id === item.id); if (i) i.nettoMonthly = v })} />
                  </Field>
                  <Field label="Gross / month (optional)">
                    <CurrencyInput value={item.brutoMonthly ?? 0} onChange={(v) => mutate((s) => { const i = s.income.find((x) => x.id === item.id); if (i) i.brutoMonthly = v })} />
                  </Field>
                  <Button variant="danger" onClick={() => mutate((s) => { s.income = s.income.filter((x) => x.id !== item.id) })}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => mutate((s) => { s.income.push({ id: uid(), name: 'New income', nettoMonthly: 0 }) })}>+ Add income</Button>
            </div>
            <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm">
              <span className="text-slate-500">Total net: <strong className="text-slate-900">{formatEUR(totalNettoMonthly(scenario.income))}/mo</strong></span>
              {ratio !== null && (
                <span className="text-slate-500">You keep <strong className="text-slate-900">{formatPct(ratio * 100)}</strong> of gross</span>
              )}
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle>Annual benefits (lumpy cash)</SectionTitle>
          <p className="mb-3 -mt-1 text-xs text-slate-400">Vakantiegeld, eindejaarspremie. Smooth into the budget or treat as a yearly windfall to invest.</p>
          <Card>
            <div className="space-y-3">
              {scenario.annualBenefits.map((b) => (
                <div key={b.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                  <Field label="Name">
                    <TextInput value={b.name} onChange={(v) => mutate((s) => { const i = s.annualBenefits.find((x) => x.id === b.id); if (i) i.name = v })} />
                  </Field>
                  <Field label="Net amount / year">
                    <CurrencyInput value={b.annualNetAmount} onChange={(v) => mutate((s) => { const i = s.annualBenefits.find((x) => x.id === b.id); if (i) i.annualNetAmount = v })} />
                  </Field>
                  <Field label="Treatment">
                    <Select value={b.treatment} options={treatmentOptions} onChange={(v) => mutate((s) => { const i = s.annualBenefits.find((x) => x.id === b.id); if (i) i.treatment = v })} />
                  </Field>
                  <Button variant="danger" onClick={() => mutate((s) => { s.annualBenefits = s.annualBenefits.filter((x) => x.id !== b.id) })}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => mutate((s) => { s.annualBenefits.push({ id: uid(), name: 'New benefit', annualNetAmount: 0, treatment: 'smoothIntoBudget' }) })}>+ Add annual benefit</Button>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle>Restricted benefits (non-cash)</SectionTitle>
          <p className="mb-3 -mt-1 text-xs text-slate-400">Maaltijdcheques, ecocheques, hospi insurance. These offset specific spending — never counted as investable cash.</p>
          <Card>
            <div className="space-y-3">
              {scenario.restrictedBenefits.map((b) => (
                <div key={b.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                  <Field label="Name">
                    <TextInput value={b.name} onChange={(v) => mutate((s) => { const i = s.restrictedBenefits.find((x) => x.id === b.id); if (i) i.name = v })} />
                  </Field>
                  <Field label="Value / month">
                    <CurrencyInput value={b.monthlyValue} onChange={(v) => mutate((s) => { const i = s.restrictedBenefits.find((x) => x.id === b.id); if (i) i.monthlyValue = v })} />
                  </Field>
                  <Field label="Offsets category">
                    <Select
                      value={b.offsetsCategory ?? ''}
                      options={offsetOptions}
                      onChange={(v) => mutate((s) => { const i = s.restrictedBenefits.find((x) => x.id === b.id); if (i) i.offsetsCategory = v === '' ? undefined : (v as ExpenseCategory) })}
                    />
                  </Field>
                  <Button variant="danger" onClick={() => mutate((s) => { s.restrictedBenefits = s.restrictedBenefits.filter((x) => x.id !== b.id) })}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => mutate((s) => { s.restrictedBenefits.push({ id: uid(), name: 'New benefit', monthlyValue: 0 }) })}>+ Add restricted benefit</Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
