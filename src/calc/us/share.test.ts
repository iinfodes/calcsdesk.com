import { describe, expect, it } from 'vitest';
import { MAX_WAGES, type FilingStatus } from './federal';
import { createSharedEstimateFragment, MAX_SHARED_FRAGMENT_LENGTH, parseSharedEstimate } from './share';

describe('atomic shared estimates', () => {
  it.each(['', '#', '#main', '#rates-sources', '#foo=bar'])('ignores unrelated anchor %s', hash => {
    expect(parseSharedEstimate(hash)).toEqual({ kind: 'none' });
  });
  it('accepts existing unversioned joint links as a complete scenario', () => {
    expect(parseSharedEstimate('#status=married_joint&wages=90000&spouse=60000')).toEqual({ kind: 'valid', input: { status: 'married_joint', wages: 90000, spouseWages: 60000 } });
  });
  it('decodes formatted wages and cents without losing the spouse zero', () => {
    expect(parseSharedEstimate('#v=1&status=married_joint&wages=75%2C000.25&spouse=0')).toEqual({ kind: 'valid', input: { status: 'married_joint', wages: 75000.25, spouseWages: 0 } });
  });
  it.each([
    'status=single', 'wages=75000', 'status=married_joint&wages=75000',
    'status=single&wages=', 'status=unknown&wages=75000',
    'status=single&wages=1&wages=2', 'status=single&%77ages=1&wages=2',
    'status=single&wages=1&status=single', 'v=1&v=1&status=single&wages=1',
    'v=2&status=single&wages=1', 'v=&status=single&wages=1',
    'status=single&wages=1&extra=2', 'status=single&wages=1&Spouse=0',
    'status=single&wages=1&', 'status=single&wages=1&spouse',
    'status=single&wages=%', 'status=single&wages=%C0%AF',
    'status=single&wages=1e3', 'status=single&wages=-1',
    'status=single&wages=0.001', 'status=single&wages=Infinity',
    'status=single&wages=1&spouse=1', 'status=single&wages=1&spouse=',
    `status=single&wages=${MAX_WAGES + 1}`,
    `status=married_joint&wages=${MAX_WAGES}&spouse=0.01`,
  ])('rejects the entire malformed or unsupported scenario %s', hash => {
    expect(parseSharedEstimate(`#${hash}`)).toEqual({ kind: 'invalid' });
  });
  it('caps untrusted fragments before decoding', () => {
    expect(parseSharedEstimate(`#status=single&wages=${'0'.repeat(MAX_SHARED_FRAGMENT_LENGTH)}`)).toEqual({ kind: 'invalid' });
  });
  it('accepts the combined maximum boundary', () => {
    expect(parseSharedEstimate(`#status=married_joint&wages=${MAX_WAGES - 0.01}&spouse=0.01`).kind).toBe('valid');
  });
});

describe('canonical explicit share fragments', () => {
  it.each<FilingStatus>(['single', 'married_joint', 'married_separate', 'head_household', 'surviving_spouse'])('round trips %s with a fully specified scenario', status => {
    const input = { status, wages: 75000.25, spouseWages: status === 'married_joint' ? 40000.5 : 0 };
    const fragment = createSharedEstimateFragment(input);
    expect(fragment.startsWith(`#v=1&status=${status}&wages=75000.25`)).toBe(true);
    expect(parseSharedEstimate(fragment)).toEqual({ kind: 'valid', input });
    expect(fragment.includes('&spouse=')).toBe(status === 'married_joint');
  });
  it('writes an explicit zero spouse for a joint scenario', () => {
    expect(createSharedEstimateFragment({ status: 'married_joint', wages: 0 })).toBe('#v=1&status=married_joint&wages=0&spouse=0');
  });
  it('refuses unsupported combined wages and non-joint spouse inputs', () => {
    expect(() => createSharedEstimateFragment({ status: 'married_joint', wages: MAX_WAGES, spouseWages: 0.01 })).toThrow();
    expect(() => createSharedEstimateFragment({ status: 'single', wages: 1, spouseWages: 1 })).toThrow();
  });
});
