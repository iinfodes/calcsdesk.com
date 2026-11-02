export type CountryCode = 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'in';
export type Task = 'Pay' | 'Tax' | 'Benefits' | 'Loans';
export interface Country { code: CountryCode; short: string; name: string; description: string; regionLabel: string; intro: string; source: string; publisher: string }
export interface Tool { id: string; country: CountryCode; task: Task; name: string; description: string; next: string; path: string; scope: string[]; availability?: 'beta' }

export const countries: Country[] = [
  { code: 'us', short: 'US', name: 'United States', description: 'Paycheck, federal tax & student loans', regionLabel: 'State', intro: 'Start with your pay, federal income tax or student-loan calculation. State and local details belong with the relevant tool.', source: 'https://www.irs.gov/individuals/tax-withholding-estimator', publisher: 'Internal Revenue Service' },
  { code: 'uk', short: 'UK', name: 'United Kingdom', description: 'Monthly salary, Income Tax & NI', regionLabel: 'Nation', intro: 'Explore equal monthly salary with the relevant UK nation’s Income Tax bands. PAYE history and other deductions are outside this beta.', source: 'https://www.gov.uk/estimate-income-tax', publisher: 'GOV.UK / HMRC' },
  { code: 'ca', short: 'CA', name: 'Canada', description: 'Income tax by province or territory', regionLabel: 'Province or territory', intro: 'Start with your province or territory. The income-tax tool will separate the federal and provincial parts of the estimate.', source: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals.html', publisher: 'Canada Revenue Agency' },
  { code: 'au', short: 'AU', name: 'Australia', description: 'Pay & take-home income', regionLabel: 'Location', intro: 'Find the pay calculator and see the planned breakdown of income, deductions and take-home pay.', source: 'https://www.ato.gov.au/calculators-and-tools', publisher: 'Australian Taxation Office' },
  { code: 'ae', short: 'UAE', name: 'United Arab Emirates', description: 'End-of-service gratuity', regionLabel: 'Employment context', intro: 'Start with the gratuity tool. Eligibility, service length and salary assumptions will be explicit before a result is shown.', source: 'https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/end-of-service-benefits-for-employees-in-the-private-sector', publisher: 'UAE Government' },
  { code: 'in', short: 'IN', name: 'India', description: 'Old vs new income-tax regime', regionLabel: 'Tax regime', intro: 'Compare the old and new income-tax regimes with the same inputs. Assumptions and deductions will be visible in the comparison.', source: 'https://www.incometax.gov.in/iec/foportal/', publisher: 'Income Tax Department' },
];

export const tools: Tool[] = [
  { id: 'paycheck', country: 'us', task: 'Pay', name: 'Paycheck calculator', description: 'See the parts of your take-home pay.', next: 'Choose your state', path: '/us/pay/paycheck-calculator/', scope: ['Salary or hourly income', 'State and local context', 'Pay frequency and deductions'] },
  { id: 'salary', country: 'uk', task: 'Pay', name: 'Salary calculator', description: 'Model equal monthly salary, Income Tax and employee NI.', next: 'Try the monthly salary beta', path: '/uk/pay/salary-calculator/', availability: 'beta', scope: ['England, Wales, Northern Ireland or Scotland', '12 equal monthly payments; annual tax model', 'No pension, student loan or PAYE history'] },
  { id: 'income-tax', country: 'ca', task: 'Tax', name: 'Income tax calculator', description: 'Find the calculation for your province.', next: 'Choose your province', path: '/ca/tax/income-tax-calculator/', scope: ['Province or territory', 'Federal and provincial breakdown', 'Income and deduction inputs'] },
  { id: 'pay', country: 'au', task: 'Pay', name: 'Pay calculator', description: 'Understand your pay in Australia.', next: 'Australian pay', path: '/au/pay/pay-calculator/', scope: ['Income and pay period', 'Tax-year context', 'Deductions and take-home breakdown'] },
  { id: 'gratuity', country: 'ae', task: 'Benefits', name: 'Gratuity calculator', description: 'Model traditional gratuity for a limited private-sector case.', next: 'Try the limited gratuity beta', path: '/ae/gratuity/gratuity-calculator/', availability: 'beta', scope: ['Foreign full-time federal private-sector workers', 'Basic wage and explicit service-day count', 'Cap-affected cases excluded pending review'] },
  { id: 'regime-comparison', country: 'in', task: 'Tax', name: 'Old vs new tax regime', description: 'Compare ordinary-salary tax for a limited resident case.', next: 'Try the salary comparison beta', path: '/in/tax/income-tax-calculator/', availability: 'beta', scope: ['Resident under 60; ordinary salary up to ₹50 lakh', 'Confirmed eligible old-regime deductions', 'Rebate, relief, cess and statutory rounding'] },
  { id: 'federal-tax', country: 'us', task: 'Tax', name: 'Federal income tax', description: 'Estimate 2026 wage-only tax before credits.', next: 'Try the beta calculator', path: '/us/tax/income-tax-calculator/', availability: 'beta', scope: ['Five filing statuses and the basic deduction', 'Employee Social Security and Medicare', 'Annual bracket-by-bracket working'] },
  { id: 'rap', country: 'us', task: 'Loans', name: 'RAP student-loan calculator', description: 'Explore the planned repayment calculation.', next: 'Student-loan repayment', path: '/us/loans/rap-calculator/', scope: ['Repayment-plan eligibility', 'Income and household assumptions', 'Payment calculation and limitations'] },
];

export const countryFor = (code: CountryCode) => countries.find(country => country.code === code)!;
export const previewHref = (tool: Tool) => tool.availability === 'beta' ? tool.path : `/${tool.country}/#${tool.id}`;
export function matchesQuery(tool: Tool, query: string): boolean {
  const country = countryFor(tool.country);
  const haystack = `${tool.name} ${tool.description} ${tool.task} ${country.name} ${country.short} ${country.code} ${tool.country === 'ae' ? 'gratuity dubai emirates' : ''}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every(word => haystack.includes(word));
}
