import { readFileSync } from 'node:fs';
import { validateFederalData } from './validate-data.mjs';
import { validateAustralianIncomeTaxData, validateUaeGratuityData } from './validate-country-data.mjs';
import { validateUkSalaryData } from '../src/calc/uk/validate.ts';
import { validateCanadianFederalData } from '../src/calc/ca/validate.ts';
import { validateIndiaRegimeData } from '../src/calc/in/validate.ts';

const records = [
  ['src/data/us/2026/federal.json', validateFederalData],
  ['src/data/uk/2026-27/salary.json', validateUkSalaryData],
  ['src/data/ae/gratuity-2026.json', validateUaeGratuityData],
  ['src/data/au/2026-27/income-tax.json', validateAustralianIncomeTaxData],
  ['src/data/ca/2026/federal.json', validateCanadianFederalData],
  ['src/data/in/2026-27/regimes.json', validateIndiaRegimeData],
];
let failed = false;
for (const [file, validate] of records) {
  try {
    const errors = validate(JSON.parse(readFileSync(file, 'utf8')));
    if (errors.length) {
      failed = true;
      console.error(`${file}:\n${errors.map(error => `  ${error}`).join('\n')}`);
    } else console.log(`${file}: structure, provenance and supported scope passed.`);
  } catch (error) {
    failed = true;
    console.error(`${file}: could not validate (${error instanceof Error ? error.message : 'unknown error'}).`);
  }
}
if (failed) process.exitCode = 1;
