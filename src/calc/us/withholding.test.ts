import { describe, expect, it } from 'vitest';
import { calculateFederalWithholding, calculateStateWithholding } from './withholding';
import { paycheckRegions } from '../../data/us/2026/paycheck-regions';

it('lists 50 states and DC with unique routes', () => {
  expect(new Set(paycheckRegions.map(region => region.slug)).size).toBe(51);
  expect(paycheckRegions).toHaveLength(51);
  expect(paycheckRegions.filter(region => region.rateBps === 0)).toHaveLength(9);
  expect(paycheckRegions.filter(region => region.rateBps === null)).toHaveLength(41);
});

it.each(paycheckRegions)('uses the appropriate state input for $name', region => {
  const amount = 2500.25;
  const expected = region.slug === 'pennsylvania' ? 76.76
    : ['alaska', 'florida', 'nevada', 'new-hampshire', 'south-dakota', 'tennessee', 'texas', 'washington', 'wyoming'].includes(region.slug) ? 0 : amount;
  expect(calculateStateWithholding(region.rateBps, amount)).toBe(expected);
});

describe('2026 federal wage withholding', () => {
  it('matches the IRS standard schedule at the single 22% threshold', () => {
    expect(calculateFederalWithholding({ taxableWages: 2500, otherIncome: 1500, periods: 26, status: 'single' })).toBe(223.08);
  });

  it('uses the Step 2 schedule and applies annual credits before extra withholding', () => {
    expect(calculateFederalWithholding({
      taxableWages: 5541.67, periods: 12, status: 'joint', step2: true,
      credits: 1200, extraPerPay: 15,
    })).toBe(398.33);
  });

  it('floors withholding after credits while keeping the per-pay addition', () => {
    expect(calculateFederalWithholding({
      taxableWages: 100, periods: 52, status: 'household', credits: 200, extraPerPay: 8,
    })).toBe(8);
  });
});
