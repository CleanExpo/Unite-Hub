/**
 * Client Layout - Phase 2 Step 3
 *
 * Protected layout for client area with:
 * - Session authentication guard
 * - Header navigation
 * - Breadcrumb support
 * - Responsive design
 */

import { redirect } from 'next/navigation';
import { getClientSession } from '@/lib/auth/supabase';
import { ClientBreadcrumbs } from '@/components/ui/Breadcrumbs';
import { ClientLogoutButton } from '@/components/client/ClientLogoutButton';
import {
  Home,
  Lightbulb,
  FolderKanban,
  Lock,
  Bot,
  Menu,
  User,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Home',
    href: '/client',
    icon: Home,
  },
  {
    label: 'Workspace',
    href: '/client/workspace',
    icon: Sparkles,
  },
  {
    label: 'My Ideas',
    href: '/client/ideas',
    icon: Lightbulb,
  },
  {
    label: 'Projects',
    href: '/client/projects',
    icon: FolderKanban,
  },
  {
    label: 'Digital Vault',
    href: '/client/vault',
    icon: Lock,
  },
  {
    label: 'AI Assistant',
    href: '/client/assistant',
    icon: Bot,
  },
];

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // Session guard: redirect to login if not authenticated
  // Phase 2 Step 5 - Real client authentication enabled
  const session = await getClientSession();

  if (!session) {
    redirect('/client/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Header */}
      <header className="bg-[#080808] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white font-mono">
                Unite-Group
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-sm text-white/40 hover:bg-white/[0.03] hover:text-white/80 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-mono">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-white font-mono">
                    {session.client?.name || session.user?.email || 'Client User'}
                  </p>
                  {session.client?.subscription_tier && (
                    <p className="text-xs text-white/40 font-mono">
                      {session.client.subscription_tier}
                    </p>
                  )}
                </div>
                <ClientLogoutButton />
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-white/40 hover:text-white/80"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs bar */}
      <div className="bg-[#080808] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ClientBreadcrumbs />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#080808] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40 font-mono">
              © {new Date().getFullYear()} Unite-Group. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
