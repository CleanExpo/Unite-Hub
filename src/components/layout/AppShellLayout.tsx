'use client';

/**
 * AppShellLayout Component
 * Global UX Shell - Phase 15 Week 3-4
 *
 * Main application shell with sidebar, top nav, and content area.
 */

import React, { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopNavBar } from './TopNavBar';
import { Breadcrumbs } from './Breadcrumbs';
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <SidebarNav collapsed={false} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavBar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn('p-6', className)}>
            {showBreadcrumbs && <Breadcrumbs className="mb-4" />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShellLayout;
