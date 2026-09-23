import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGHS(amount: number): string {
  return `GH₵ ${amount.toFixed(2)}`;
}

export function detectGhanaCarrier(phone: string): { name: string; slug: 'mtn' | 'telecel' | 'at' | 'unknown' } {
  // Strip non-digits and leading country code
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('233')) {
    clean = '0' + clean.slice(3);
  }
  if (!clean.startsWith('0')) {
    clean = '0' + clean;
  }

  const prefix = clean.slice(0, 3);
  if (['024', '054', '055', '059', '025'].includes(prefix)) {
    return { name: 'MTN MoMo', slug: 'mtn' };
  }
  if (['020', '050'].includes(prefix)) {
    return { name: 'Telecel Cash', slug: 'telecel' };
  }
  if (['027', '057', '026', '056'].includes(prefix)) {
    return { name: 'AT Money', slug: 'at' };
  }
  return { name: 'Ghana Mobile', slug: 'unknown' };
}
