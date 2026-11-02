import { expect, test, type Page, type Request } from '@playwright/test';

const calculator = '/in/tax/income-tax-calculator/';
async function open(page: Page) {
  await page.goto(calculator);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('India comparison reverses lower modeled regime when eligible old deductions change', async ({ page }) => {
  await open(page);
  await expect(page.getByTestId('india-old-tax')).toHaveText('₹2,10,600.00');
  await expect(page.getByTestId('india-new-tax')).toHaveText('₹97,500.00');
  await expect(page.getByTestId('india-comparison')).toHaveText('New regime has ₹1,13,100.00 lower modeled tax.');
  await page.getByLabel('Additional eligible old-regime deductions · INR', { exact: true }).fill('600000');
  await expect(page.getByTestId('india-old-tax')).toHaveText('₹85,800.00');
  await expect(page.getByTestId('india-new-tax')).toHaveText('₹97,500.00');
  await expect(page.getByTestId('india-comparison')).toHaveText('Old regime has ₹11,700.00 lower modeled tax.');
  await expect(page.locator('.india-comparison-summary')).toContainText('does not recommend a regime');
  await expect(page.locator('.india-calculator').getByRole('table', { name: 'Old regime · annual taxable income', exact: true })).toBeVisible();
  await expect(page.locator('.india-calculator').getByRole('table', { name: 'New regime · annual taxable income', exact: true })).toBeVisible();
});

test('India new-regime rebate transitions to visible marginal relief above its threshold', async ({ page }) => {
  await open(page);
  await page.locator('#india-old-deductions').fill('0');
  await page.getByLabel('Annual salary before standard deduction · INR', { exact: true }).fill('12,75,000');
  await expect(page.getByTestId('india-new-taxable')).toHaveText('₹12,00,000.00');
  await expect(page.getByTestId('india-new-rebate')).toHaveText('₹60,000.00');
  await expect(page.getByTestId('india-new-tax')).toHaveText('₹0.00');
  await page.locator('#india-salary').fill('1280000');
  await expect(page.getByTestId('india-new-rebate')).toHaveText('₹0.00');
  await expect(page.getByTestId('india-new-relief')).toHaveText('₹55,750.00');
  await expect(page.getByTestId('india-new-tax')).toHaveText('₹5,200.00');
});

test('India invalid salary or deductions remove both stale results and recover', async ({ page }) => {
  await open(page);
  const salary = page.locator('#india-salary'), deductions = page.locator('#india-old-deductions');
  await salary.fill('5000000.01');
  await expect(salary).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('india-old-tax')).toHaveCount(0);
  await expect(page.getByTestId('india-new-tax')).toHaveCount(0);
  await expect(page.locator('#india-input-error')).toContainText('whole-rupee');
  await salary.fill('1500000');
  await deductions.fill('1500000');
  await expect(deductions).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('india-old-tax')).toHaveCount(0);
  await expect(page.getByTestId('india-new-tax')).toHaveCount(0);
  await expect(page.locator('#india-input-error')).toContainText('after the modeled standard deduction');
  await deductions.fill('150000');
  await expect(page.getByTestId('india-old-tax')).toHaveText('₹2,10,600.00');
  await expect(page.getByTestId('india-new-tax')).toHaveText('₹97,500.00');
});

test('India input edits send no requests and do not write financial inputs to storage or URL', async ({ page }) => {
  await open(page);
  const requests: string[] = [];
  const observe = (request: Request) => { requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`); };
  page.on('request', observe);
  const beforeUrl = page.url();
  const storage = () => page.evaluate(() => ({ local: Object.entries(localStorage).sort(), session: Object.entries(sessionStorage).sort() }));
  const beforeStorage = await storage();
  await page.locator('#india-salary').fill('1623456');
  await page.locator('#india-old-deductions').fill('234567');
  await expect(page.getByTestId('india-comparison')).toBeVisible();
  // Observe queued effects on a live connection; no route mocking or offline mode hides submissions.
  await page.waitForTimeout(200);
  expect(requests).toEqual([]);
  expect(await storage()).toEqual(beforeStorage);
  expect(page.url()).toBe(beforeUrl);
  page.off('request', observe);
});

test('India beta has readable current-year sources, keyboard inputs and no page overflow', async ({ page }) => {
  await open(page);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://calcsdesk.com${calculator}`);
  const sources = page.locator('#india-sources');
  await expect(sources.getByRole('heading', { level: 2 })).toHaveText('Tax Year 2026-27 rates and sources.');
  await expect(sources).toContainText('human review pending');
  await expect(sources).toContainText('official worked-example and human-review gates pending');
  await expect(sources.getByRole('link').first()).toHaveAttribute('href', /^https:\/\/www\.incometaxindia\.gov\.in\//);
  await page.locator('#india-salary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#india-old-deductions')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
