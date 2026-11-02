import { expect, test, type Page, type Request } from '@playwright/test';

const uae = '/ae/gratuity/gratuity-calculator/';
const uk = '/uk/pay/salary-calculator/';
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('UAE service bands subtract absence and distinguish below-one-year service', async ({ page }) => {
  await open(page, uae);
  await expect(page.getByTestId('uae-gratuity')).toContainText('35,000.00');
  await page.getByLabel('Monthly basic wage · AED', { exact: true }).fill('6000');
  await page.getByLabel('Total calendar service days', { exact: true }).fill('2555');
  await expect(page.getByTestId('uae-gratuity')).toContainText('33,000.00');
  await page.getByLabel('Unpaid absence days to exclude', { exact: true }).fill('730');
  await expect(page.getByTestId('uae-gratuity')).toContainText('21,000.00');
  await page.getByLabel('Unpaid absence days to exclude', { exact: true }).fill('0');
  await page.getByLabel('Total calendar service days', { exact: true }).fill('365');
  await expect(page.getByTestId('uae-gratuity')).toContainText('4,200.00');
  await page.getByLabel('Unpaid absence days to exclude', { exact: true }).fill('1');
  await expect(page.getByTestId('uae-gratuity')).toHaveText(/\b0\.00$/);
  await expect(page.getByText('Below one year of counted service: no gratuity in this model.', { exact: true })).toBeVisible();
});

test('UAE unsupported cap and invalid day counts hide old results and recover', async ({ page }) => {
  await open(page, uae);
  await page.locator('#uae-service').fill('36500');
  await expect(page.getByTestId('uae-gratuity')).toHaveCount(0);
  await expect(page.locator('#uae-input-error')).toContainText('Cap-affected cases are unsupported');
  await expect(page.locator('#uae-input-error')).toContainText('does not mean your gratuity is zero');
  await page.locator('#uae-service').fill('1825');
  await expect(page.getByTestId('uae-gratuity')).toContainText('35,000.00');
  await page.locator('#uae-absence').fill('1826');
  await expect(page.locator('#uae-absence')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('uae-gratuity')).toHaveCount(0);
  await page.locator('#uae-absence').fill('0');
  await page.locator('#uae-service').fill('365.5');
  await expect(page.locator('#uae-service')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('uae-gratuity')).toHaveCount(0);
  await page.locator('#uae-service').fill('1825');
  await expect(page.getByTestId('uae-gratuity')).toContainText('35,000.00');
});

test('UK nation changes update salary tax while NI remains a monthly charge', async ({ page }) => {
  await open(page, uk);
  await expect(page.getByTestId('uk-annual-gross')).toHaveText('£60,000.00');
  await expect(page.getByTestId('uk-annual-tax')).toHaveText('£11,432.00');
  await expect(page.getByTestId('uk-remainder')).toHaveText('£3,779.83');
  await expect(page.getByTestId('uk-monthly-ni')).toContainText('£267.50');
  await page.getByLabel('Your Income Tax nation', { exact: true }).selectOption('scotland');
  await expect(page.getByTestId('uk-annual-tax')).toHaveText('£13,182.05');
  await expect(page.getByTestId('uk-remainder')).toHaveText('£3,634.00');
  await expect(page.getByTestId('uk-monthly-ni')).toContainText('£267.50');
  await expect(page.getByRole('table', { name: 'Scotland · annual taxable salary bands' })).toBeVisible();
  await page.getByLabel('Your Income Tax nation', { exact: true }).selectOption('wales');
  await page.getByLabel('Gross pay each month', { exact: true }).fill('10000');
  await expect(page.getByTestId('uk-allowance')).toHaveText('£2,570.00');
  await expect(page.getByTestId('uk-annual-tax')).toHaveText('£39,432.00');
});

test('UK monthly NI rounding and invalid pay never leave stale estimates', async ({ page }) => {
  await open(page, uk);
  const pay = page.getByLabel('Gross pay each month', { exact: true });
  await pay.fill('1048');
  await expect(page.getByTestId('uk-monthly-ni')).toContainText('£0.00');
  await expect(page.getByTestId('uk-annual-tax')).toHaveText('£1.20');
  await pay.fill('4189.25');
  await expect(page.getByTestId('uk-monthly-ni')).toContainText('£251.28');
  await pay.fill('4189.26');
  await expect(page.getByTestId('uk-monthly-ni')).toContainText('£251.29');
  await pay.fill('100000.01');
  await expect(pay).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('uk-remainder')).toHaveCount(0);
  await expect(page.locator('#uk-input-error')).toContainText('£100,000');
  await pay.fill('5000');
  await expect(page.getByTestId('uk-remainder')).toHaveText('£3,779.83');
});

for (const country of ['UAE', 'UK'] as const) {
  test(`${country} edits send no requests and do not write inputs into storage or URL`, async ({ page }) => {
    await open(page, country === 'UAE' ? uae : uk);
    // Attach after hydration: observe genuine browser requests without going offline or mocking transport.
    const requests: string[] = [];
    const observe = (request: Request) => { requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`); };
    page.on('request', observe);
    const beforeUrl = page.url();
    const storage = () => page.evaluate(() => ({ local: Object.entries(localStorage).sort(), session: Object.entries(sessionStorage).sort() }));
    const beforeStorage = await storage();
    if (country === 'UAE') {
      await page.locator('#uae-basic').fill('6123.45');
      await page.locator('#uae-service').fill('2555');
      await page.locator('#uae-absence').fill('7');
      await expect(page.getByTestId('uae-gratuity')).toBeVisible();
    } else {
      await page.locator('#uk-monthly-pay').fill('5123.45');
      await page.locator('#uk-nation').selectOption('scotland');
      await expect(page.getByTestId('uk-remainder')).toBeVisible();
    }
    // Allow queued input effects a short observation window; no network is disabled here.
    await page.waitForTimeout(200);
    expect(requests).toEqual([]);
    expect(await storage()).toEqual(beforeStorage);
    expect(page.url()).toBe(beforeUrl);
    page.off('request', observe);
  });

  test(`${country} retains readable source caveats, beta indexing and a usable narrow layout`, async ({ page }) => {
    const path = country === 'UAE' ? uae : uk;
    await open(page, path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://calcsdesk.com${path}`);
    const source = page.locator(country === 'UAE' ? '#uae-sources' : '#uk-sources');
    await expect(source.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(source).toContainText(/human (?:legal )?review pending/i);
    await expect(source.getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
    if (country === 'UAE') {
      await expect(source).toContainText('0 of 2 required');
      await expect(source).toContainText('search excerpt');
      await page.locator('#uae-basic').focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('#uae-service')).toBeFocused();
    } else {
      await expect(page.locator('#uk-examples-title')).toHaveText('HMRC’s salary-only examples.');
      await expect(page.locator('.calculator-examples .source-footnote')).toBeVisible();
      await expect(page.locator('.calculator-examples .source-footnote')).toContainText('They do not verify a complete PAYE payslip.');
      await page.locator('#uk-monthly-pay').focus();
      await expect(page.locator('#uk-monthly-pay')).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
