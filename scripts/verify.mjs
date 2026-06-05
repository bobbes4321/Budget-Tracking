import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForSelector('h1:has-text("Dashboard")')
await page.screenshot({ path: 'scripts/verify-dashboard.png', fullPage: true })

await page.click('nav button:has-text("Invest & Project")')
await page.waitForSelector('text=Projected value over 40 years')
await page.waitForTimeout(400)
await page.screenshot({ path: 'scripts/verify-invest.png', fullPage: true })

await page.click('nav button:has-text("Pension")')
await page.waitForSelector('text=Projected total at retirement')
await page.waitForTimeout(400)
await page.screenshot({ path: 'scripts/verify-pension.png', fullPage: true })

console.log('CONSOLE_ERRORS:' + JSON.stringify(errors))
await browser.close()
