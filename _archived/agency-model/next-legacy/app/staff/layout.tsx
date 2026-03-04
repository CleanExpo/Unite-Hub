/**
 * Staff Layout - Phase 2 Step 3
 *
 * Protected layout for staff area with:
 * - Session authentication guard
 * - Sidebar navigation
 * - Breadcrumb support
 * - Responsive design
 */

import { redirect } from 'next/navigation';
import { getStaffSession } from '@/next/core/auth/supabase';
import { StaffBreadcrumbs } from '@/next/components/ui/Breadcrumbs';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import Link from 'next/link';

interface StaffLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/staff',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/staff/projects',
    icon: FolderKanban,
  },
  {
    label: 'Tasks',
    href: '/staff/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Activity',
    href: '/staff/activity',
    icon: Activity,
  },
  {
    label: 'Settings',
    href: '/staff/settings',
    icon: Settings,
  },
];

export default async function StaffLayout({ children }: StaffLayoutProps) {
  // Session guard: redirect to login if not authenticated
  const session = await getStaffSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-gray-100">
            Unite-Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Staff Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {session.user.email}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user.user_metadata?.role || 'Staff'}
              </p>
            </div>
            <button
              className="ml-3 text-gray-400 hover:text-gray-100 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with breadcrumbs */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <StaffBreadcrumbs />

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
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
