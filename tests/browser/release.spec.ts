import { expect, test, type Page } from '@playwright/test';

const calculator = '/us/tax/income-tax-calculator/';
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('home presents the working beta before optional plans', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('.tool-card')).toHaveCount(4);
  await expect(page.locator('.beta-tool-label')).toHaveText([/Interactive beta/, /Interactive beta/, /Interactive beta/, /Interactive beta/]);
  await page.getByRole('button', { name: 'Canada', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matching beta calculator yet.' })).toBeVisible();
  await page.getByLabel('Show tools in preparation').check();
  await expect(page.locator('.tool-card')).toHaveCount(1);
  await expect(page.locator('.tool-card')).toContainText('In preparation');
  await page.locator('#calculator-search').fill('no-result');
  await expect(page.getByRole('heading', { name: 'No matching calculator yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters' }).click();
  await expect(page.locator('.tool-card')).toHaveCount(4);
  await expect(page.getByLabel('Show tools in preparation')).not.toBeChecked();
});

test('search submission moves keyboard focus to the results heading', async ({ page }) => {
  await open(page, '/');
  await page.locator('#calculator-search').fill('federal tax');
  await page.locator('#calculator-search').press('Enter');
  await expect(page.locator('#directory-title')).toBeFocused();
});

test('country preference is optional, local and never redirects the visitor', async ({ page }) => {
  await open(page, '/');
  await page.getByRole('button', { name: 'Canada', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('calcsdesk-country'))).toBeNull();
  await page.getByLabel('Remember my country filter on this device').check();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Canada', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\/$/);
  await page.getByLabel('Remember my country filter on this device').uncheck();
  expect(await page.evaluate(() => localStorage.getItem('calcsdesk-country'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('button', { name: 'All countries', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('country finder distinguishes beta from planned calculations', async ({ page }) => {
  await open(page, '/us/');
  await page.getByLabel('What would you like to work out?').selectOption('federal-tax');
  await expect(page.locator('.finder-recommendation')).toContainText('Interactive beta');
  await page.getByRole('link', { name: 'Open calculator', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(calculator + '$'));
  await expect(page.getByTestId('income-tax')).toHaveText('$7,670.00');
});

test('joint wages, invalid totals and monthly averages stay consistent', async ({ page }) => {
  await open(page, calculator);
  await page.getByLabel('Filing status', { exact: true }).selectOption('married_joint');
  await page.getByLabel('Your annual wage income', { exact: true }).fill('90000');
  await page.getByLabel('Spouse’s annual wage income', { exact: true }).fill('60000');
  await expect(page.getByTestId('income-tax')).toHaveText('$15,340.00');
  await page.getByRole('button', { name: 'Monthly average', exact: true }).click();
  await expect(page.getByTestId('income-tax')).toHaveText('$1,278.33');
  await page.getByLabel('Your annual wage income', { exact: true }).fill('10000000');
  await expect(page.getByLabel('Your annual wage income', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Spouse’s annual wage income', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('income-tax')).toHaveCount(0);
  await page.getByLabel('Your annual wage income', { exact: true }).fill('90000');
  await expect(page.getByTestId('income-tax')).toHaveText('$1,278.33');
});

test('an already loaded calculation works offline without sending wages', async ({ page, context }) => {
  await open(page, calculator);
  await expect(page.getByTestId('income-tax')).toHaveText('$7,670.00');
  await context.setOffline(true);
  await page.getByLabel('Your annual wage income', { exact: true }).fill('90000');
  await expect(page.getByTestId('income-tax')).toHaveText('$10,970.00');
});

test('valid fragment restores a complete joint estimate', async ({ page }) => {
  await open(page, calculator + '#status=married_joint&wages=90000&spouse=60000');
  await expect(page.getByLabel('Filing status', { exact: true })).toHaveValue('married_joint');
  await expect(page.getByTestId('income-tax')).toHaveText('$15,340.00');
});

test('a malformed shared estimate cannot partially replace the current scenario', async ({ page }) => {
  await open(page, calculator);
  await page.evaluate(() => { location.hash = 'status=married_joint&wages=90000&spouse=broken'; });
  await expect(page.getByText('This shared estimate link is invalid. Your current inputs have not changed.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Filing status', { exact: true })).toHaveValue('single');
  await expect(page.getByLabel('Your annual wage income', { exact: true })).toHaveValue('75000');
  await expect(page.getByTestId('income-tax')).toHaveText('$7,670.00');
});

test('comparison uses independent inputs and removes stale results after invalid input', async ({ page }) => {
  await open(page, calculator);
  await page.getByLabel('Compare with a second scenario').check();
  await page.getByLabel('Scenario B your annual wage income', { exact: true }).fill('75000');
  const table = page.getByRole('table', { name: 'Annual comparison · B minus A' });
  const taxRow = table.getByRole('row').filter({ hasText: 'Regular federal income tax before credits' });
  await expect(taxRow.getByRole('cell')).toHaveText(['$7,670.00', '$7,670.00', '$0.00']);
  await page.getByLabel('Scenario B your annual wage income', { exact: true }).fill('90000');
  await expect(taxRow.getByRole('cell')).toHaveText(['$7,670.00', '$10,970.00', '+$3,300.00']);
  await page.getByLabel('Scenario B your annual wage income', { exact: true }).fill('-1');
  await expect(table).toHaveCount(0);
  await expect(page.getByTestId('income-tax')).toHaveText('$7,670.00');
});

test('all 95 sitemap entries are canonical and indexable', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(new Set(urls).size).toBe(95);
  expect(urls).toHaveLength(95);
  for (const url of urls) {
    const canonical = new URL(url);
    expect(canonical.origin).toBe('https://calcsdesk.com');
    const response = await request.get(canonical.pathname);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('content="index, follow,');
    expect(html).toContain('<link rel="canonical" href="' + url + '">');
  }
});

test('useful links and source tables survive disabled JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + '/');
  await expect(page.locator('.tool-card')).toHaveCount(4);
  await page.locator('.tool-card[href="/us/tax/income-tax-calculator/"]').click();
  await expect(page.getByText('JavaScript is needed for interactive results.', { exact: true })).toBeVisible();
  await expect(page.locator('#rates-sources')).toBeVisible();
  await context.close();
});

test('home and calculator fit the viewport in light and dark themes', async ({ page }) => {
  for (const route of ['/', calculator]) {
    await open(page, route);
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
});
