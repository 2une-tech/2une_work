import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats project pay amounts for UI (matches API list/detail mapping). */
export function formatPayAmount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return INR_FORMATTER.format(n);
}

export function formatINRRange(min: number, max: number): string {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return '—';
  const a = Number.isFinite(min) ? min : (Number.isFinite(max) ? max : 0);
  const b = Number.isFinite(max) ? max : a;
  return a === b ? formatINR(a) : `${formatINR(a)} - ${formatINR(b)}`;
}
