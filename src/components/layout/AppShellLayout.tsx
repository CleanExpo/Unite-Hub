'use client';

/**
 * AppShellLayout Component
 * Global UX Shell - Phase 15 Week 5-6
 *
 * Production-polished application shell with:
 * - Accessible navigation
 * - Skip to content link
 * - Metadata updates
 * - Keyboard navigation support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopNavBar } from './TopNavBar';
import { Breadcrumbs } from './Breadcrumbs';
import { MetadataUpdater } from './MetadataUpdater';
import { cn } from '@/lib/utils';

interface AppShellLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
}

export function AppShellLayout({
  children,
  className,
  showBreadcrumbs = true,
}: AppShellLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Metadata updater */}
      <MetadataUpdater />

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar - Desktop */}
        <nav className="hidden md:block" aria-label="Main navigation">
          <SidebarNav
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </nav>

        {/* Sidebar - Mobile Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <nav
              className="fixed inset-y-0 left-0 z-50 md:hidden animate-in slide-in-from-left duration-200"
              aria-label="Mobile navigation"
            >
              <SidebarNav collapsed={false} />
            </nav>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <TopNavBar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Content Area */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto focus:outline-none"
            tabIndex={-1}
          >
            <div className={cn('p-4 sm:p-6 lg:p-8', className)}>
              {showBreadcrumbs && <Breadcrumbs className="mb-4 sm:mb-6" />}
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default AppShellLayout;
