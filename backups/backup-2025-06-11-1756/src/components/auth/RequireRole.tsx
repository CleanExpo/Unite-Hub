// ================================================
// Role-Based Access Control Component
// ================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRole } from '@/lib/auth/hooks';
import { UserRole } from '@/lib/auth/types';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

/**
 * Component that restricts content based on user role
 */
export function RequireRole({
  roles,
  children,
  fallback = null,
  redirectTo,
  showError = true,
}: RequireRoleProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { hasRole } = useRole(roles);
  
  useEffect(() => {
    if (!loading && !hasRole && redirectTo) {
      router.push(redirectTo);
    }
  }, [loading, hasRole, redirectTo, router]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // User doesn't have required role
  if (!hasRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don&apos;t have permission to access this content.
            </p>
            {user ? (
              <p className="mt-1 text-xs text-gray-400">
                Required role: {roles.join(' or ')} (You have: {user.role})
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                Please log in to continue.
              </p>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  }
  
  // User has required role
  return <>{children}</>;
}

/**
 * HOC for protecting pages with role requirements
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: UserRole[],
  options: {
    redirectTo?: string;
    fallback?: React.ReactNode;
  } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <RequireRole
        roles={requiredRoles}
        redirectTo={options.redirectTo}
        fallback={options.fallback}
      >
        <Component {...props} />
      </RequireRole>
    );
  };
}

/**
 * Component for displaying content based on multiple role conditions
 */
interface RoleBasedContentProps {
  children: React.ReactNode;
  roles?: {
    Master?: React.ReactNode;
    Admin?: React.ReactNode;
    Manager?: React.ReactNode;
    User?: React.ReactNode;
  };
  defaultContent?: React.ReactNode;
}

export function RoleBasedContent({
  children,
  roles,
  defaultContent,
}: RoleBasedContentProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }
  
  if (!user) {
    return <>{defaultContent || null}</>;
  }
  
  // If roles object is provided, show role-specific content
  if (roles && user.role in roles) {
    return <>{roles[user.role as keyof typeof roles]}</>;
  }
  
  // Otherwise show children
  return <>{children}</>;
}

/**
 * Utility component for admin-only content
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['Master', 'Admin']} showError={false}>
      {children}
    </RequireRole>
  );
}

/**
 * Utility component for master-only content
 */
export function MasterOnly({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['Master']} showError={false}>
      {children}
    </RequireRole>
  );
}

/**
 * Hook for conditional rendering based on roles
 */
export function useRoleBasedVisibility(roles: UserRole[]): {
  isVisible: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
} {
  const { user, loading } = useAuth();
  const { hasRole } = useRole(roles);
  
  return {
    isVisible: hasRole,
    isLoading: loading,
    userRole: user?.role || null,
  };
}
