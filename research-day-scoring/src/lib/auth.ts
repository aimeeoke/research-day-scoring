// Authentication utilities for Research Day Scoring System
// Simple code-based access control for a single-day event

// =============================================================================
// ACCESS CODES - Change these before the event!
// =============================================================================

export const ACCESS_CODES = {
  judge: 'CVMBS2026',    // Shared with all judges at orientation
  admin: '2026',          // Committee members only
} as const;

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  judgeAuth: 'rd-judge-auth',
  adminAuth: 'rd-admin-auth',
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type AccessLevel = 'public' | 'judge' | 'admin';

export interface AuthState {
  isJudge: boolean;
  isAdmin: boolean;
  judgeName?: string;
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * Check if user has judge access
 */
export function hasJudgeAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.judgeAuth) === 'true';
}

/**
 * Check if user has admin access
 */
export function hasAdminAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.adminAuth) === 'true';
}

/**
 * Verify judge code and grant access
 */
export function verifyJudgeCode(code: string): boolean {
  if (code.toUpperCase().trim() === ACCESS_CODES.judge) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.judgeAuth, 'true');
    }
    return true;
  }
  return false;
}

/**
 * Verify admin PIN and grant access
 */
export function verifyAdminPin(pin: string): boolean {
  if (pin.trim() === ACCESS_CODES.admin) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.adminAuth, 'true');
    }
    return true;
  }
  return false;
}

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
  return {
    isJudge: hasJudgeAccess(),
    isAdmin: hasAdminAccess(),
  };
}

/**
 * Clear all auth (for testing/logout)
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.judgeAuth);
  localStorage.removeItem(STORAGE_KEYS.adminAuth);
}

/**
 * Get the minimum required access level for a route
 */
export function getRequiredAccess(pathname: string): AccessLevel {
  // Public routes
  if (pathname === '/feedback' || pathname.startsWith('/feedback/submit')) {
    return 'public';
  }
  
  // Judge routes
  if (pathname === '/judge' || pathname.startsWith('/judge/')) {
    return 'judge';
  }
  
  // Everything else requires admin
  return 'admin';
}

/**
 * Check if user can access a given route
 */
export function canAccessRoute(pathname: string): boolean {
  const required = getRequiredAccess(pathname);
  
  switch (required) {
    case 'public':
      return true;
    case 'judge':
      return hasJudgeAccess() || hasAdminAccess();
    case 'admin':
      return hasAdminAccess();
    default:
      return false;
  }
}

// =============================================================================
// SELECTED JUDGE STORAGE
// =============================================================================

const SELECTED_JUDGE_KEY = 'rd-selected-judge';

/**
 * Save selected judge name for the session
 */
export function saveSelectedJudge(judgeName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_JUDGE_KEY, judgeName);
}

/**
 * Get previously selected judge name
 */
export function getSelectedJudge(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_JUDGE_KEY);
}

/**
 * Clear selected judge
 */
export function clearSelectedJudge(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SELECTED_JUDGE_KEY);
}
