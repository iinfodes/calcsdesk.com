import { expect, it } from 'vitest';
import rates from '../../data/ca/2026/jurisdictions.json';
import { calculateBracketTax } from './federal';

it('applies the second Alberta rate only above the first band', () => {
  const alberta = rates.jurisdictions.find(region => region.name === 'Alberta')!;
  const result = calculateBracketTax(61_201, alberta.brackets);
  expect(result.tax).toBe(4896.10);
  expect(result.bands[1].taxable).toBe(1);
});

it('preserves the June 2026 British Columbia schedule and the separate Quebec schedule', () => {
  const bc = rates.jurisdictions.find(region => region.name === 'British Columbia')!;
  const qc = rates.jurisdictions.find(region => region.name === 'Quebec')!;
  expect(calculateBracketTax(50_000, bc.brackets).tax).toBe(2800);
  expect(calculateBracketTax(54_445, qc.brackets).tax).toBe(7627.30);
});

it('includes 13 unique schedules with increasing bounds and an open final band', () => {
  expect(new Set(rates.jurisdictions.map(region => region.name)).size).toBe(13);
  for (const region of rates.jurisdictions) {
    let previous = 0;
    for (const band of region.brackets.slice(0, -1)) {
      expect(band.up_to).toBeGreaterThan(previous);
      previous = band.up_to!;
    }
    expect(region.brackets.at(-1)?.up_to).toBeNull();
  }
});
