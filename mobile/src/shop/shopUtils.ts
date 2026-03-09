import { API_BASE_URL } from '../config';

export function resolveApiUrl(maybeRelative: string | undefined | null): string | undefined {
  if (!maybeRelative) return undefined;
  if (maybeRelative.startsWith('http://') || maybeRelative.startsWith('https://')) return maybeRelative;
  if (maybeRelative.startsWith('/')) return `${API_BASE_URL}${maybeRelative}`;
  return maybeRelative;
}

export function formatINR(amount: number | undefined | null): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

