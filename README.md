# Budget & Invest

A private, local-first budgeting and investment-planning app, tailored to a
Belgian context. It normalizes all your costs into a true monthly figure, shows
your investable surplus, and projects it forward — including pension planning
with Belgian tax modeling.

**All data stays in your browser** (`localStorage`). Nothing is sent anywhere.
Use **Settings → Export backup** regularly to save a `.json` copy.

> ⚠️ Personal estimates only — **not financial or tax advice**. Belgian tax
> figures are indexed and change yearly; review them under **Settings**.

## Running it

```powershell
npm install      # first time only
npm run dev      # start the dev server → http://localhost:5173
```

To build a static version you can open/host locally:

```powershell
npm run build    # output in dist/
npm run preview  # serve the built version
```

Run the calculation tests:

```powershell
npm run test
```

## What's inside

| Tab | What it does |
|---|---|
| **Dashboard** | Income, true monthly cost, surplus, and 20/30/40-year projection at a glance. |
| **Income** | Net salary (gross is reference only), plus Belgian benefits — lumpy cash (vakantiegeld, eindejaarspremie) and restricted (maaltijdcheques, ecocheques). |
| **Expenses** | Every cost, monthly or irregular, normalized to its true monthly equivalent. |
| **Goals** | Sinking funds for big one-off expenses (e.g. driver's license) → how much to set aside per month. |
| **Invest & Project** | Sandbox with sliders + a 40-year growth chart. Real (today's money) by default, with Belgian tax drags. |
| **Pension** | Forward & backward planning to retirement, with pensioensparen (3rd-pillar) tax modeling. |
| **Scenarios** | Save named variants ("baseline", "license year") and compare them side by side. |
| **Settings** | Surplus allocation, editable Belgian tax assumptions, and export/import/reset. |

## How the money math works

- **True monthly cost** — each expense is divided by its frequency in months
  (a €360 yearly bill = €30/month).
- **Surplus** = available income (net salary + smoothed annual benefits) − true
  monthly cost − monthly contributions to savings goals.
- **Projections** compound monthly using the *effective* annual rate, then show
  values in **today's money** (deflated by inflation) and net of a configurable
  capital-gains/TOB tax drag.
- **Pension** models two pots: tax-advantaged *pensioensparen* (with the
  30%/25% refund and a one-off maturity tax) and a regular brokerage pot.

All of this lives in pure, unit-tested functions under `src/calc/`.

## Tech

Vite · React · TypeScript · Recharts · Zustand · Tailwind CSS · Vitest.

`scripts/verify.mjs` is a Playwright smoke test that drives the running app and
screenshots the main tabs (`node scripts/verify.mjs` while `npm run dev` is up).
