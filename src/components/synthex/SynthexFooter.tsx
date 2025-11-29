/**
 * Synthex Footer Component
 * Phase 4 of Unite-Hub Rebuild
 *
 * Footer for Synthex client portal with:
 * - Copyright notice
 * - Legal links
 * - Support links
 */

import React from 'react';
import Link from 'next/link';

export function SynthexFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © {currentYear} Synthex by Unite-Hub. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/synthex/help"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
