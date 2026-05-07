import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(date: string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-PH', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function fmtDate(date: string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PH', { dateStyle: 'medium' });
}

export function truncate(str: string, len = 40): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
