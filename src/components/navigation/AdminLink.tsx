// ================================================
// Admin Link Navigation Component
// ================================================

'use client';

import Link from 'next/link';
import { Shield, Users, Settings, ChartBar, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth/hooks';
import { UserRole } from '@/lib/auth/types';

interface AdminLinkProps {
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

/**
 * Admin navigation link component
 * Only visible to Master and Admin users
 */
export function AdminLink({ 
  className = '', 
  showIcon = true, 
  showLabel = true 
}: AdminLinkProps) {
  const { user, loading } = useAuth();
  
  // Don't render until we know the user's role
  if (loading || !user) {
    return null;
  }
  
  // Only show for Master and Admin users
  if (user.role !== 'Master' && user.role !== 'Admin') {
    return null;
  }
  
  return (
    <Link 
      href="/dashboard/admin" 
      className={`flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
    >
      {showIcon && <Shield className="w-5 h-5" />}
      {showLabel && <span>Admin Panel</span>}
    </Link>
  );
}

/**
 * Admin navigation menu
 * Full menu for admin section with role-based visibility
 */
export function AdminNavigationMenu() {
  const { user, loading } = useAuth();
  
  if (loading || !user) {
    return null;
  }
  
  // Only show for Master and Admin users
  if (!['Master', 'Admin'].includes(user.role)) {
    return null;
  }
  
  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard/admin',
      icon: ChartBar,
      roles: ['Master', 'Admin'] as UserRole[],
    },
    {
      label: 'User Management',
      href: '/dashboard/admin/users',
      icon: Users,
      roles: ['Master', 'Admin'] as UserRole[],
    },
    {
      label: 'Permissions',
      href: '/dashboard/admin/permissions',
      icon: Key,
      roles: ['Master'] as UserRole[],
    },
    {
      label: 'System Settings',
      href: '/dashboard/admin/settings',
      icon: Settings,
      roles: ['Master'] as UserRole[],
    },
  ];
  
  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );
  
  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Administration
        </h3>
      </div>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Admin badge component
 * Shows user's role badge
 */
export function AdminBadge() {
  const { user } = useAuth();
  
  if (!user || user.role === 'User') {
    return null;
  }
  
  const roleColors = {
    Master: 'bg-purple-100 text-purple-800',
    Admin: 'bg-blue-100 text-blue-800',
    Manager: 'bg-green-100 text-green-800',
    User: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
      {user.role}
    </span>
  );
}

/**
 * Admin-only content wrapper
 * Wraps content that should only be visible to admins
 */
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  roles?: UserRole[];
}

export function AdminOnly({ 
  children, 
  fallback = null,
  roles = ['Master', 'Admin'] 
}: AdminOnlyProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }
  
  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): {
  isAdmin: boolean;
  isMaster: boolean;
  isLoading: boolean;
} {
  const { user, loading } = useAuth();
  
  return {
    isAdmin: user ? ['Master', 'Admin'].includes(user.role) : false,
    isMaster: user?.role === 'Master',
    isLoading: loading,
  };
}
