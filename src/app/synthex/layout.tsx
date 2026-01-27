/**
 * Synthex Layout
 *
 * Shared layout for all /synthex/* pages providing:
 * - Header with navigation
 * - Tier badge display
 * - Mobile responsive nav
 * - Footer
 */

import Link from 'next/link';
import {
  Home,
  Lightbulb,
  FolderKanban,
  Bot,
  Sparkles,
  BarChart3,
  Megaphone,
  Search,
  FileText,
  Lock,
  LogOut,
  Menu,
  Radar,
} from 'lucide-react';

interface SynthexLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: 'Home', href: '/synthex/dashboard', icon: Home },
  { label: 'Projects', href: '/synthex/projects', icon: FolderKanban },
  { label: 'Campaigns', href: '/synthex/campaigns', icon: Megaphone },
  { label: 'Analytics', href: '/synthex/analytics', icon: BarChart3 },
  { label: 'SEO', href: '/synthex/seo', icon: Search },
  { label: 'Radar', href: '/synthex/market-radar', icon: Radar },
  { label: 'Content', href: '/synthex/content', icon: FileText },
  { label: 'Vault', href: '/synthex/vault', icon: Lock },
  { label: 'AI Assistant', href: '/synthex/assistant', icon: Bot },
];

export default function SynthexLayout({ children }: SynthexLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/synthex/dashboard" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">Synthex</h1>
                <p className="text-xs text-gray-400">AI Marketing Platform</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navigationItems.slice(0, 7).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Link
                href="/synthex/assistant"
                className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors text-sm"
              >
                <Bot className="h-4 w-4" />
                <span>AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Synthex by Unite-Hub
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-100 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-100 transition-colors">
                Terms
              </Link>
              <Link href="/support" className="text-sm text-gray-400 hover:text-gray-100 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
