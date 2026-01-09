'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Lock, Users, Shield } from 'lucide-react';
import { 
  hasJudgeAccess, 
  hasAdminAccess, 
  verifyJudgeCode, 
  verifyAdminPin,
  AccessLevel 
} from '@/lib/auth';

interface AuthGateProps {
  children: ReactNode;
  requiredLevel: AccessLevel;
}

export function AuthGate({ children, requiredLevel }: AuthGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authorization on mount
    if (requiredLevel === 'public') {
      setIsAuthorized(true);
    } else if (requiredLevel === 'judge') {
      setIsAuthorized(hasJudgeAccess() || hasAdminAccess());
    } else if (requiredLevel === 'admin') {
      setIsAuthorized(hasAdminAccess());
    }
  }, [requiredLevel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (requiredLevel === 'judge') {
      if (verifyJudgeCode(code)) {
        setIsAuthorized(true);
      } else {
        setError('Invalid event code. Please try again.');
      }
    } else if (requiredLevel === 'admin') {
      if (verifyAdminPin(code)) {
        setIsAuthorized(true);
      } else {
        setError('Invalid PIN. Please try again.');
      }
    }
  };

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csu-green"></div>
      </div>
    );
  }

  // Authorized - show content
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Not authorized - show login form
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          {requiredLevel === 'judge' ? (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Judge Access</h2>
              <p className="text-gray-600 mt-2">
                Enter the event code provided at judge orientation.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-csu-green/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-csu-green" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Committee Access</h2>
              <p className="text-gray-600 mt-2">
                Enter your admin PIN to continue.
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="sr-only">
              {requiredLevel === 'judge' ? 'Event Code' : 'Admin PIN'}
            </label>
            <input
              type={requiredLevel === 'admin' ? 'password' : 'text'}
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={requiredLevel === 'judge' ? 'Enter event code' : 'Enter PIN'}
              className="w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-csu-green"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-csu-green text-white py-3 px-4 rounded-lg font-medium hover:bg-csu-green/90 transition-colors"
          >
            {requiredLevel === 'judge' ? 'Enter as Judge' : 'Access Dashboard'}
          </button>
        </form>

        {requiredLevel === 'admin' && (
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Are you a judge?{' '}
              <a href="/" className="text-csu-green hover:underline">
                Go to Scoring Portal
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience wrappers
export function JudgeGate({ children }: { children: ReactNode }) {
  return <AuthGate requiredLevel="judge">{children}</AuthGate>;
}

export function AdminGate({ children }: { children: ReactNode }) {
  return <AuthGate requiredLevel="admin">{children}</AuthGate>;
}
