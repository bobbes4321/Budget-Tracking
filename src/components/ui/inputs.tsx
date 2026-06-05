import type { ReactNode } from 'react'
import { FREQUENCY_PRESETS, type Frequency } from '../../types'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min,
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        className={`${inputClass} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}

export function CurrencyInput(props: { value: number; onChange: (v: number) => void; step?: number }) {
  return <NumberInput {...props} prefix="€" min={0} step={props.step ?? 10} />
}

export function PercentInput(props: { value: number; onChange: (v: number) => void; step?: number }) {
  return <NumberInput {...props} suffix="%" min={0} step={props.step ?? 0.5} />
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <select
      className={inputClass}
      value={value}
      onChange={(e) => {
        const raw = e.target.value
        const match = options.find((o) => String(o.value) === raw)
        if (match) onChange(match.value)
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function FrequencyPicker({
  value,
  onChange,
}: {
  value: Frequency
  onChange: (f: Frequency) => void
}) {
  const isPreset = FREQUENCY_PRESETS.some((p) => p.everyMonths === value.everyMonths)
  return (
    <div className="flex gap-2">
      <select
        className={inputClass}
        value={isPreset ? value.everyMonths : 'custom'}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            onChange({ everyMonths: value.everyMonths })
          } else {
            onChange({ everyMonths: parseInt(e.target.value, 10) })
          }
        }}
      >
        {FREQUENCY_PRESETS.map((p) => (
          <option key={p.everyMonths} value={p.everyMonths}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {!isPreset && (
        <div className="w-32">
          <NumberInput
            value={value.everyMonths}
            min={1}
            onChange={(n) => onChange({ everyMonths: Math.max(1, Math.round(n)) })}
            suffix="mo"
          />
        </div>
      )}
    </div>
  )
}
