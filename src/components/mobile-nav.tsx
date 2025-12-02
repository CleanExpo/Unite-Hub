'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MobileNav({ user, loading }: { user?: { id: string; email?: string }; loading?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:text-blue-400 transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-20 left-0 right-0 bg-[#051224]/95 backdrop-blur-sm border-b border-white/10 z-40 shadow-lg">
          <nav className="flex flex-col space-y-1 p-4">
            <a
              href="#how-it-works"
              className="text-white hover:text-blue-400 transition-colors px-3 py-2 rounded hover:bg-white/5"
              onClick={() => setIsOpen(false)}
            >
              How it Works
            </a>
            <a
              href="#who-we-help"
              className="text-white hover:text-blue-400 transition-colors px-3 py-2 rounded hover:bg-white/5"
              onClick={() => setIsOpen(false)}
            >
              Who We Help
            </a>
            <a
              href="#pricing"
              className="text-white hover:text-blue-400 transition-colors px-3 py-2 rounded hover:bg-white/5"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </a>

            {/* Divider */}
            <div className="my-2 border-t border-white/10" />

            {/* Auth Links */}
            {loading ? (
              <div className="px-3 py-2 h-10 bg-white/20 rounded animate-pulse" />
            ) : user ? (
              <Link
                href="/synthex/dashboard"
                className="block px-3 py-2 rounded font-semibold text-sm bg-[#347bf7] text-white hover:bg-blue-700 transition-colors text-center"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded font-semibold text-sm text-white border border-white/50 hover:bg-white/10 transition-colors text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded font-semibold text-sm bg-[#347bf7] text-white hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Start Trial
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
