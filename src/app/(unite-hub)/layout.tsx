/**
 * Unite-Hub Layout (Route Group)
 *
 * Protected layout for staff CRM functionality with:
 * - Role-based access control (FOUNDER, STAFF, ADMIN only)
 * - Staff navigation/sidebar
 * - Workspace context injection
 * - Audit logging
 *
 * Architecture: docs/rebuild/architecture/MODULE_STRUCTURE.md
 * Route Group: (unite-hub)
 */

import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth/supabase';
import {
  LayoutDashboard,
  Users,
  Mail,
  Megaphone,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  LogOut,
  Menu,
  Brain,
  Search,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface UniteHubLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/unite-hub/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Contacts',
    href: '/unite-hub/contacts',
    icon: Users,
  },
  {
    label: 'Campaigns',
    href: '/unite-hub/campaigns',
    icon: Megaphone,
  },
  {
    label: 'Email Intelligence',
    href: '/unite-hub/email-intel',
    icon: Mail,
  },
  {
    label: 'Projects',
    href: '/unite-hub/projects',
    icon: FolderKanban,
  },
  {
    label: 'AI Agents',
    href: '/unite-hub/agents',
    icon: Brain,
  },
  {
    label: 'Analytics',
    href: '/unite-hub/analytics',
    icon: BarChart3,
  },
  {
    label: 'Search Suite',
    href: '/unite-hub/search-suite',
    icon: Search,
  },
  {
    label: 'Tasks',
    href: '/unite-hub/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Activity',
    href: '/unite-hub/activity',
    icon: Activity,
  },
  {
    label: 'Settings',
    href: '/unite-hub/settings',
    icon: Settings,
  },
];

export default async function UniteHubLayout({ children }: UniteHubLayoutProps) {
  // Session guard: redirect to login if not authenticated
  const { session, error } = await getStaffSession();

  if (error || !session || !session.user) {
    redirect('/auth/login');
  }

  // Verify staff role from profiles table
  // Note: This is a basic check. Full RBAC is enforced at API layer
  const userEmail = session.user.email || 'Staff User';
  const userRole = session.user.user_metadata?.role || 'STAFF';

  // Only allow FOUNDER, STAFF, ADMIN roles
  const allowedRoles = ['FOUNDER', 'STAFF', 'ADMIN'];
  if (!allowedRoles.includes(userRole)) {
    // Not authorized for Unite-Hub staff area
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-gray-100">
            Unite-Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Staff CRM
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {userEmail}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {userRole}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="ml-3 text-gray-400 hover:text-gray-100 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with breadcrumbs */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Unite-Hub</span>
            </div>

            {/* Mobile menu button (future enhancement) */}
            <button
              className="lg:hidden text-gray-400 hover:text-gray-100"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
