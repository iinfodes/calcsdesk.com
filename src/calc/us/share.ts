import { estimateFederal, federalRates, parseWages, type FederalInput, type FilingStatus } from './federal';

export const MAX_SHARED_FRAGMENT_LENGTH = 512;
export type SharedEstimate = Required<FederalInput>;
export type SharedEstimateResult = { kind: 'none' } | { kind: 'invalid' } | { kind: 'valid'; input: SharedEstimate };
const keys = new Set(['v', 'status', 'wages', 'spouse']);

/** Decode an entire explicit estimate before callers update any form state. */
export function parseSharedEstimate(fragment: string): SharedEstimateResult {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!raw || !raw.includes('=')) return { kind: 'none' };
  if (raw.length > MAX_SHARED_FRAGMENT_LENGTH) return { kind: 'invalid' };
  // URLSearchParams tolerates broken percent escapes and UTF-8; shared inputs must not.
  try { decodeURIComponent(raw.replaceAll('+', ' ')); } catch { return { kind: 'invalid' }; }
  const params = new URLSearchParams(raw);
  if (![...params.keys()].some(key => keys.has(key))) return { kind: 'none' };
  const seen = new Set<string>();
  for (const segment of raw.split('&')) if (!segment.includes('=')) return { kind: 'invalid' };
  for (const key of params.keys()) {
    if (!keys.has(key) || seen.has(key)) return { kind: 'invalid' };
    seen.add(key);
  }
  if (params.has('v') && params.get('v') !== '1') return { kind: 'invalid' };
  const status = params.get('status');
  if (!federalRates.filing_statuses.some(row => row.id === status)) return { kind: 'invalid' };
  const wages = parseWages(params.get('wages') ?? '');
  const spouseText = params.get('spouse');
  if (status === 'married_joint' && spouseText === null) return { kind: 'invalid' };
  const spouseWages = spouseText === null ? 0 : parseWages(spouseText);
  if (wages === null || spouseWages === null) return { kind: 'invalid' };
  const input = { status: status as FilingStatus, wages, spouseWages };
  try { estimateFederal(input); } catch { return { kind: 'invalid' }; }
  return { kind: 'valid', input };
}

/** Only an explicit Share action should place financial inputs into a URL. */
export function createSharedEstimateFragment(input: FederalInput): string {
  estimateFederal(input);
  const params = new URLSearchParams({ v: '1', status: input.status, wages: String(input.wages) });
  if (input.status === 'married_joint') params.set('spouse', String(input.spouseWages ?? 0));
  return `#${params.toString()}`;
}
