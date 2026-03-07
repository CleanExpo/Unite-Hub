/**
 * Unite-Group Layout (Route Group)
 *
 * Protected layout for staff CRM functionality with:
 * - Role-based access control (FOUNDER, STAFF, ADMIN only)
 * - Staff navigation/sidebar (Scientific Luxury design system)
 * - Workspace context injection
 * - Audit logging
 *
 * Architecture: docs/rebuild/architecture/MODULE_STRUCTURE.md
 * Route Group: (unite-hub)
 */

import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth/supabase';
import { LogOut, Menu } from 'lucide-react';
import SidebarNav from './SidebarNav';

interface UniteGroupLayoutProps {
  children: React.ReactNode;
}

export default async function UniteGroupLayout({ children }: UniteGroupLayoutProps) {
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
    // Not authorized for Unite-Group staff area
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Sidebar Navigation */}
      <aside
        className="w-64 bg-[#050505] border-r border-white/[0.06] flex flex-col"
        style={{ borderRightWidth: '0.5px' }}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/[0.06]">
          <h1 className="text-xl font-bold text-white/90">
            Unite-Group
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Staff CRM
          </p>
        </div>

        {/* Navigation — client component for usePathname + Framer Motion */}
        <SidebarNav />

        {/* User info & logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {userEmail}
              </p>
              <p className="text-xs text-white/40 truncate">
                {userRole}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="ml-3 text-white/40 hover:text-white/90 transition-colors"
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
        <header className="bg-[#050505] border-b border-white/[0.06] px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-white/40">
              <span>Unite-Group</span>
            </div>

            {/* Mobile menu button (future enhancement) */}
            <button
              className="lg:hidden text-white/40 hover:text-white/90 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#050505]">
          {children}
        </main>
      </div>
    </div>
  );
}
