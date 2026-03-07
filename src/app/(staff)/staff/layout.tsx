// Force dynamic rendering for auth-dependent layout
export const dynamic = 'force-dynamic';

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
import { getStaffSession } from '@/lib/auth/supabase';
import { StaffBreadcrumbs } from '@/components/ui/Breadcrumbs';
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

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const userEmail = session.user.email || 'User';
  const userRole = session.user.user_metadata?.role || 'Staff';

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#080808] border-r border-white/[0.06] flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/[0.06]">
          <h1 className="text-xl font-bold text-white font-mono">
            Unite-Group
          </h1>
          <p className="text-sm text-white/40 mt-1 font-mono">
            Staff Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-sm text-white/40 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span className="font-mono text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate font-mono">
                {userEmail}
              </p>
              <p className="text-xs text-white/40 truncate font-mono">
                {userRole}
              </p>
            </div>
            <button
              className="ml-3 text-white/40 hover:text-white/80 transition-colors"
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
        <header className="bg-[#080808] border-b border-white/[0.06] px-8 py-4">
          <div className="flex items-center justify-between">
            <StaffBreadcrumbs />

            {/* Mobile menu button (future enhancement) */}
            <button
              className="lg:hidden text-white/40 hover:text-white/80"
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
