// Utility functions for Research Day Scoring System

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format presenter name (First Last)
 */
export function formatPresenterName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format score for display
 */
export function formatScore(score: number | null, decimals: number = 2): string {
  if (score === null) return '—';
  return score.toFixed(decimals);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format date/time for display
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get color class based on completion percentage
 */
export function getProgressColor(percent: number): string {
  if (percent >= 100) return 'text-green-600 bg-green-100';
  if (percent >= 75) return 'text-yellow-600 bg-yellow-100';
  if (percent >= 50) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

/**
 * Get status badge color
 */
export function getStatusColor(status: 'pending' | 'partial' | 'complete' | 'no-show'): string {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800';
    case 'no-show':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-red-100 text-red-800';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(
  array: T[],
  keys: { key: keyof T; order: 'asc' | 'desc' }[]
): T[] {
  return [...array].sort((a, b) => {
    for (const { key, order } of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Generate a short readable ID
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Check if running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
