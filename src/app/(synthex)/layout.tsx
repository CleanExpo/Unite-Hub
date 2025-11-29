/**
 * Synthex Layout (Route Group)
 *
 * Protected layout for client marketing portal with:
 * - Role-based access control (CLIENT role, or FOUNDER/ADMIN for testing)
 * - Client-specific navigation
 * - Synthex tier validation for feature access
 * - Client branding
 *
 * Architecture: docs/rebuild/architecture/MODULE_STRUCTURE.md
 * Route Group: (synthex)
 */

import { redirect } from 'next/navigation';
import { getClientSession } from '@/lib/auth/supabase';
import {
  Home,
  Lightbulb,
  FolderKanban,
  Lock,
  Bot,
  Menu,
  Sparkles,
  BarChart3,
  Megaphone,
  Search,
  FileText,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

interface SynthexLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Home',
    href: '/synthex/dashboard',
    icon: Home,
  },
  {
    label: 'Workspace',
    href: '/synthex/workspace',
    icon: Sparkles,
  },
  {
    label: 'My Ideas',
    href: '/synthex/ideas',
    icon: Lightbulb,
  },
  {
    label: 'Projects',
    href: '/synthex/projects',
    icon: FolderKanban,
  },
  {
    label: 'Campaigns',
    href: '/synthex/campaigns',
    icon: Megaphone,
  },
  {
    label: 'Analytics',
    href: '/synthex/analytics',
    icon: BarChart3,
  },
  {
    label: 'SEO Reports',
    href: '/synthex/seo',
    icon: Search,
  },
  {
    label: 'Content Library',
    href: '/synthex/content',
    icon: FileText,
  },
  {
    label: 'Digital Vault',
    href: '/synthex/vault',
    icon: Lock,
  },
  {
    label: 'AI Assistant',
    href: '/synthex/assistant',
    icon: Bot,
  },
];

export default async function SynthexLayout({ children }: SynthexLayoutProps) {
  // Session guard: redirect to login if not authenticated
  const session = await getClientSession();

  if (!session) {
    redirect('/client/login');
  }

  // Extract client info
  const clientName = session.client?.name || session.user?.email || 'Client User';
  const subscriptionTier = session.client?.subscription_tier || 'starter';

  // Check if user has valid role for Synthex access
  // Allow CLIENT role, or FOUNDER/ADMIN for testing
  const userRole = session.user?.user_metadata?.role;
  const allowedRoles = ['CLIENT', 'FOUNDER', 'ADMIN'];

  if (userRole && !allowedRoles.includes(userRole)) {
    // Not authorized for Synthex client portal
    redirect('/unauthorized');
  }

  // Tier badge styling
  const getTierBadge = (tier: string) => {
    const badges = {
      starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      professional: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      elite: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return badges[tier as keyof typeof badges] || badges.starter;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">
                  Synthex
                </h1>
                <p className="text-xs text-gray-400">
                  Marketing Intelligence
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-100">
                    {clientName}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getTierBadge(subscriptionTier)}`}>
                      {subscriptionTier}
                    </span>
                  </div>
                </div>
                <form action="/api/auth/client-logout" method="post">
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-gray-100 transition-colors"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </form>
              </div>

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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Synthex by Unite-Hub. All rights reserved.
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
