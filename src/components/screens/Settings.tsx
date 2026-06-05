import { useRef, useState } from 'react'
import { useActiveScenario, useBudgetStore } from '../../store/useBudgetStore'
import { exportState, parseImportedState } from '../../persistence/storage'
import { makeDefaultState } from '../../store/defaults'
import { BELGIAN_TAX_YEAR } from '../../calc/belgian'
import { formatPct } from '../../utils/format'
import { Card, PageHeader, SectionTitle, Button } from '../ui/primitives'
import { Field, PercentInput } from '../ui/inputs'

export function SettingsScreen() {
  const scenario = useActiveScenario()
  const mutate = useBudgetStore((s) => s.mutateActive)
  const replaceState = useBudgetStore((s) => s.replaceState)
  const fullState = useBudgetStore.getState
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const a = scenario.assumptions
  const alloc = scenario.allocation
  const allocSum = alloc.emergencyTopUpPct + alloc.investPct + alloc.bufferPct

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const state = parseImportedState(String(reader.result))
        replaceState(state)
        setImportError(null)
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Could not import file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Surplus allocation, Belgian tax assumptions, and your data." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>How to split the surplus</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Emergency fund">
              <PercentInput value={alloc.emergencyTopUpPct} step={5} onChange={(v) => mutate((s) => { s.allocation.emergencyTopUpPct = v })} />
            </Field>
            <Field label="Invest">
              <PercentInput value={alloc.investPct} step={5} onChange={(v) => mutate((s) => { s.allocation.investPct = v })} />
            </Field>
            <Field label="Buffer / fun">
              <PercentInput value={alloc.bufferPct} step={5} onChange={(v) => mutate((s) => { s.allocation.bufferPct = v })} />
            </Field>
          </div>
          <p className={`mt-2 text-xs ${allocSum === 100 ? 'text-slate-400' : 'text-amber-600'}`}>
            {allocSum === 100 ? 'Adds up to 100%.' : `Currently ${allocSum}% — consider making it total 100%.`}
          </p>
        </Card>

        <Card>
          <SectionTitle>Belgian tax assumptions · tax year {BELGIAN_TAX_YEAR}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expected nominal return">
              <PercentInput value={a.nominalReturnPct} onChange={(v) => mutate((s) => { s.assumptions.nominalReturnPct = v })} />
            </Field>
            <Field label="Inflation">
              <PercentInput value={a.inflationPct} onChange={(v) => mutate((s) => { s.assumptions.inflationPct = v })} />
            </Field>
            <Field label="TOB (beurstaks) per buy">
              <PercentInput value={a.tobPct} step={0.01} onChange={(v) => mutate((s) => { s.assumptions.tobPct = v })} />
            </Field>
            <Field label="Capital-gains tax">
              <PercentInput value={a.capitalGainsTaxPct} onChange={(v) => mutate((s) => { s.assumptions.capitalGainsTaxPct = v })} />
            </Field>
            <Field label="Reynders tax (bond funds)">
              <PercentInput value={a.reyndersTaxPct} onChange={(v) => mutate((s) => { s.assumptions.reyndersTaxPct = v })} />
            </Field>
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
            ⚠️ These figures are indexed and change yearly — and Belgium's capital-gains rules are in flux ({formatPct(a.capitalGainsTaxPct)} is a placeholder for the new solidarity tax). Verify against current law. Not financial advice.
          </p>
        </Card>

        <Card>
          <SectionTitle>Your data</SectionTitle>
          <p className="mb-3 text-sm text-slate-500">Everything is stored locally in your browser. Export regularly to back up or move between devices.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportState(fullState())}>Export backup (.json)</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import backup</Button>
            <Button variant="danger" onClick={() => { if (confirm('Reset everything to the default scenario? This cannot be undone.')) replaceState(makeDefaultState()) }}>Reset all</Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = '' }} />
          {importError && <p className="mt-2 text-xs text-red-600">{importError}</p>}
        </Card>
      </div>
    </div>
  )
}
