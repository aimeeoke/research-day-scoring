'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { hasJudgeAccess, hasAdminAccess } from '@/lib/auth';

export function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check auth state on mount and when localStorage changes
    const checkAuth = () => {
      setIsJudge(hasJudgeAccess());
      setIsAdmin(hasAdminAccess());
    };
    
    checkAuth();
    
    // Listen for storage changes (in case another tab logs in/out)
    window.addEventListener('storage', checkAuth);
    
    // Also re-check periodically in case of same-tab changes
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Public links - everyone sees these (judges are the primary users)
  const publicLinks = [
    { href: '/', label: 'Scoring' },
    { href: '/comments', label: 'Comments' },
  ];

  // Admin links - only admins see these
  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/monitor', label: 'Monitor' },
    { href: '/admin/results', label: 'Results' },
  ];

  // Build nav items based on access level
  const navItems = [
    ...publicLinks,
    ...(isAdmin ? adminLinks : []),
  ];

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="px-3 py-2 text-sm hover:bg-white/10 rounded-md transition-colors"
          >
            {item.label}
          </a>
        ))}
        
        {/* Show access level indicator */}
        {isAdmin && (
          <span className="ml-2 px-2 py-1 text-xs bg-csu-gold text-csu-green rounded-full font-medium">
            Admin
          </span>
        )}
        {isJudge && !isAdmin && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full font-medium">
            Judge
          </span>
        )}
      </nav>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden p-2 hover:bg-white/10 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile nav dropdown */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-csu-green border-t border-white/20 md:hidden z-50">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-sm hover:bg-white/10 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {/* Admin login link for non-admins */}
            {!isAdmin && (
              <a
                href="/admin"
                className="px-4 py-3 text-sm hover:bg-white/10 rounded-md border-t border-white/20 mt-2 pt-4 text-csu-gold"
                onClick={() => setIsOpen(false)}
              >
                Admin Login
              </a>
            )}
            {/* Show current access level */}
            {isAdmin && (
              <div className="px-4 py-2 mt-2 border-t border-white/20">
                <span className="text-xs bg-csu-gold text-csu-green px-2 py-1 rounded-full font-medium">
                  Admin Access
                </span>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
