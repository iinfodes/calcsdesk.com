export type CountryCode = 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'in';
export type Task = 'Pay' | 'Tax' | 'Benefits' | 'Loans';
export interface Country { code: CountryCode; short: string; name: string; description: string; regionLabel: string; intro: string; source: string; publisher: string }
export interface Tool { id: string; country: CountryCode; task: Task; name: string; description: string; next: string; path: string; scope: string[] }

export const countries: Country[] = [
  { code: 'us', short: 'US', name: 'United States', description: 'Paycheck, federal tax & student loans', regionLabel: 'State', intro: 'Start with your pay, federal income tax or student-loan calculation. State and local details belong with the relevant tool.', source: 'https://www.irs.gov/individuals/tax-withholding-estimator', publisher: 'Internal Revenue Service' },
  { code: 'uk', short: 'UK', name: 'United Kingdom', description: 'Salary & Scotland take-home pay', regionLabel: 'Nation', intro: 'Explore your salary calculation, with a separate route for Scotland. Pay periods and deductions will be shown beside the working.', source: 'https://www.gov.uk/estimate-income-tax', publisher: 'GOV.UK / HMRC' },
  { code: 'ca', short: 'CA', name: 'Canada', description: 'Income tax by province or territory', regionLabel: 'Province or territory', intro: 'Start with your province or territory. The income-tax tool will separate the federal and provincial parts of the estimate.', source: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals.html', publisher: 'Canada Revenue Agency' },
  { code: 'au', short: 'AU', name: 'Australia', description: 'Pay & take-home income', regionLabel: 'Location', intro: 'Find the pay calculator and see the planned breakdown of income, deductions and take-home pay.', source: 'https://www.ato.gov.au/calculators-and-tools', publisher: 'Australian Taxation Office' },
  { code: 'ae', short: 'UAE', name: 'United Arab Emirates', description: 'End-of-service gratuity', regionLabel: 'Employment context', intro: 'Start with the gratuity tool. Eligibility, service length and salary assumptions will be explicit before a result is shown.', source: 'https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/end-of-service-benefits-for-employees-in-the-private-sector', publisher: 'UAE Government' },
  { code: 'in', short: 'IN', name: 'India', description: 'Old vs new income-tax regime', regionLabel: 'Tax regime', intro: 'Compare the old and new income-tax regimes with the same inputs. Assumptions and deductions will be visible in the comparison.', source: 'https://www.incometax.gov.in/iec/foportal/', publisher: 'Income Tax Department' },
];

export const tools: Tool[] = [
  { id: 'paycheck', country: 'us', task: 'Pay', name: 'Paycheck calculator', description: 'See the parts of your take-home pay.', next: 'Choose your state', path: '/us/pay/paycheck-calculator/', scope: ['Salary or hourly income', 'State and local context', 'Pay frequency and deductions'] },
  { id: 'salary', country: 'uk', task: 'Pay', name: 'Salary calculator', description: 'Explore pay, deductions and net salary.', next: 'UK or Scotland', path: '/uk/pay/salary-calculator/', scope: ['UK or Scotland calculation', 'Pay periods', 'Pension and student-loan assumptions'] },
  { id: 'income-tax', country: 'ca', task: 'Tax', name: 'Income tax calculator', description: 'Find the calculation for your province.', next: 'Choose your province', path: '/ca/tax/income-tax-calculator/', scope: ['Province or territory', 'Federal and provincial breakdown', 'Income and deduction inputs'] },
  { id: 'pay', country: 'au', task: 'Pay', name: 'Pay calculator', description: 'Understand your pay in Australia.', next: 'Australian pay', path: '/au/pay/pay-calculator/', scope: ['Income and pay period', 'Tax-year context', 'Deductions and take-home breakdown'] },
  { id: 'gratuity', country: 'ae', task: 'Benefits', name: 'Gratuity calculator', description: 'Work through an end-of-service estimate.', next: 'UAE employment', path: '/ae/gratuity/gratuity-calculator/', scope: ['Employment eligibility', 'Basic salary and service length', 'Formula and assumptions'] },
  { id: 'regime-comparison', country: 'in', task: 'Tax', name: 'Old vs new tax regime', description: 'Compare the two income-tax routes.', next: 'Compare tax regimes', path: '/in/tax/income-tax-calculator/', scope: ['Matching income inputs', 'Regime-specific deductions', 'Side-by-side calculation'] },
  { id: 'federal-tax', country: 'us', task: 'Tax', name: 'Federal income tax', description: 'Follow the steps in a federal tax estimate.', next: 'Federal calculation', path: '/us/tax/income-tax-calculator/', scope: ['Filing status', 'Taxable income and deductions', 'Bracket-by-bracket working'] },
  { id: 'rap', country: 'us', task: 'Loans', name: 'RAP student-loan calculator', description: 'Explore the planned repayment calculation.', next: 'Student-loan repayment', path: '/us/loans/rap-calculator/', scope: ['Repayment-plan eligibility', 'Income and household assumptions', 'Payment calculation and limitations'] },
];

export const countryFor = (code: CountryCode) => countries.find(country => country.code === code)!;
export const previewHref = (tool: Tool) => `/${tool.country}/#${tool.id}`;
export function matchesQuery(tool: Tool, query: string): boolean {
  const country = countryFor(tool.country);
  const haystack = `${tool.name} ${tool.description} ${tool.task} ${country.name} ${country.short} ${country.code} ${tool.country === 'ae' ? 'gratuity dubai emirates' : ''}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every(word => haystack.includes(word));
}
