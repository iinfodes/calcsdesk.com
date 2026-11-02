// Isolated local browser checks for the narrow 2026/27 monthly-pay beta.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
(async () => {
  const root = path.resolve('dist');
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/uk/pay/salary-calculator/`);
    await page.locator('astro-island:not([ssr])').waitFor();
    check('UK calculator remains noindex', await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex, follow');
    check('Default £5,000 monthly pay reproduces HMRC Table 2a annual tax', await page.locator('[data-testid="uk-annual-tax"]').textContent() === '£11,432.00');
    check('Default NI uses actual monthly thresholds', await page.locator('[data-testid="uk-monthly-ni"]').textContent() === '−£267.50');
    check('Monthly remainder reconciles shown deductions', await page.locator('[data-testid="uk-remainder"]').textContent() === '£3,779.83');
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    const storageBefore = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await page.getByLabel('Your Income Tax nation', { exact: true }).selectOption('scotland');
    check('Scotland changes annual bands and reproduces Table 2b precision', await page.locator('[data-testid="uk-annual-tax"]').textContent() === '£13,182.05');
    check('Scotland leaves category A NI unchanged', await page.locator('[data-testid="uk-monthly-ni"]').textContent() === '−£267.50');
    for (const nation of ['england','wales','northern_ireland']) {
      await page.getByLabel('Your Income Tax nation', { exact: true }).selectOption(nation);
      check(`${nation} uses rest-of-UK salary schedule`, await page.locator('[data-testid="uk-annual-tax"]').textContent() === '£11,432.00');
    }
    const resultStatus = page.locator('.calculator-results > [role="status"]');
    await resultStatus.evaluate(el => { window.ukReviewStatus = el; });
    await page.getByLabel('Gross pay each month', { exact: true }).fill('100000.01');
    check('Unsupported amount marks field invalid and hides stale results', await page.locator('#uk-monthly-pay').getAttribute('aria-invalid') === 'true' && await page.locator('[data-testid="uk-remainder"]').count() === 0);
    check('Validation message is associated and announced', (await page.locator('#uk-monthly-pay').getAttribute('aria-describedby')).includes('uk-input-error') && (await page.locator('#uk-input-error').textContent()).includes('£100,000'));
    await page.getByLabel('Gross pay each month', { exact: true }).fill('1048');
    check('Recovery retains live-region node and refreshes result', await resultStatus.evaluate(el => window.ukReviewStatus === el) && (await resultStatus.textContent()).includes('£1,047.90'));
    check('Monthly NI zero threshold is not replaced by annual threshold', await page.locator('[data-testid="uk-monthly-ni"]').textContent() === '−£0.00' && await page.locator('[data-testid="uk-annual-tax"]').textContent() === '£1.20');
    await page.getByLabel('Gross pay each month', { exact: true }).fill('10000');
    check('High-income allowance taper is visible', await page.locator('[data-testid="uk-allowance"]').textContent() === '£2,570.00');
    await page.getByLabel('Your Income Tax nation', { exact: true }).selectOption('england');
    const region = page.getByRole('region', { name: 'England · annual taxable salary bands', exact: true });
    await region.focus();
    check('Tax-band working region is keyboard focusable', await region.evaluate(el => document.activeElement === el));
    await page.getByLabel('Gross pay each month', { exact: true }).fill('5000');
    check('No financial input is submitted or written to browser storage', requests.length === 0 && storageBefore === await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })));
    check('UK has no estimate-share control or wage URL fragment', await page.getByRole('button', { name: /copy.*link/i }).count() === 0 && await page.evaluate(() => location.hash === ''));
    const out = path.resolve('design/selected'); fs.mkdirSync(out, { recursive: true });
    await page.locator('.uk-salary-calculator').screenshot({ path: path.join(out, 'uk-salary-desktop.png') });
    await page.setViewportSize({ width: 375, height: 812 });
    check('375px layout has no document overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.uk-salary-calculator').screenshot({ path: path.join(out, 'uk-salary-mobile.png') });
    await page.emulateMedia({ media: 'print' });
    check('Print retains estimate and supported-case assumptions', await page.locator('[data-testid="uk-remainder"]').isVisible() && await page.locator('.uk-scope-note').isVisible() && await page.locator('.scope-disclosure').isVisible());
    check('Print hides the print action', !await page.getByRole('button', { name: 'Print estimate' }).isVisible());
    await page.emulateMedia({ media: 'screen' });
    await page.getByLabel('Gross pay each month', { exact: true }).fill('6000');
    await page.reload();
    await page.locator('astro-island:not([ssr])').waitFor();
    check('Reload restores defaults rather than persisting entered salary', await page.locator('#uk-monthly-pay').inputValue() === '5000');
    check('No browser runtime errors', errors.length === 0);
    console.log(JSON.stringify({ checks: checks.length, passed: checks }, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
