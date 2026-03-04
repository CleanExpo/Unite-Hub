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
import { getClientSession } from '@/next/core/auth/supabase';
import { ClientBreadcrumbs } from '@/next/components/ui/Breadcrumbs';
import {
  Home,
  Lightbulb,
  FolderKanban,
  Lock,
  Bot,
  Menu,
  User,
  LogOut,
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

/**
 * Get client session
 * For Phase 2 Step 3, we create a placeholder function
 * In production, this would verify client_users table
 */
async function getClientSession() {
  // TODO: Implement proper client session check
  // For now, return null to allow development
  return null;
}

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // Session guard: redirect to login if not authenticated
  const session = await getClientSession();

  // Temporarily disabled for development - will enable in Phase 2 Step 4
  // if (!session) {
  //   redirect('/auth/login');
  // }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-100">
                Unite-Hub
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
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-100">
                      {session.user?.email || 'Client User'}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-100 transition-colors"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-400">
                  <User className="h-5 w-5" />
                  <span className="text-sm">Guest</span>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-400 hover:text-gray-100"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs bar */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
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
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Unite-Hub. All rights reserved.
            </p>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
