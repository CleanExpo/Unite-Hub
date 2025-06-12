// ================================================
// Authentication Hooks
// ================================================

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  AuthError, 
  AuthContextType, 
  LoginCredentials, 
  PermissionCheck,
  DEFAULT_PERMISSIONS,
  ModuleType 
} from './types';
import { authenticateUser, signOutUser, getCurrentUser, refreshSession, checkUserPermission } from './auth';
import { supabaseClient } from '@/lib/supabase/client';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Set up auth state listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load current user
  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
      setError({
        code: 'LOAD_USER_ERROR',
        message: 'Failed to load user information',
      });
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticateUser(credentials);
      
      if (response.error) {
        setError({
          code: 'LOGIN_ERROR',
          message: response.error,
        });
        return response;
      }
      
      if (response.user) {
        setUser(response.user);
        
        // Navigate based on role
        if (response.user.role === 'Master' || response.user.role === 'Admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/crm');
        }
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError({
        code: 'LOGIN_ERROR',
        message: errorMessage,
      });
      return {
        user: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      setError(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError({
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout',
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check permission function
  const checkPermission = useCallback((check: PermissionCheck): boolean => {
    if (!user) return false;
    
    // Master has all permissions
    if (user.role === 'Master') return true;
    
    // Check against default permissions
    const rolePermissions = DEFAULT_PERMISSIONS[user.role];
    const modulePermission = rolePermissions.find(p => p.module === check.module);
    
    if (!modulePermission) return false;
    
    switch (check.action) {
      case 'read':
        return modulePermission.canRead;
      case 'write':
        return modulePermission.canWrite;
      case 'delete':
        return modulePermission.canDelete;
      case 'admin':
        return modulePermission.canAdmin;
      default:
        return false;
    }
  }, [user]);

  // Refresh session function
  const refreshSessionHandler = useCallback(async () => {
    try {
      setLoading(true);
      const response = await refreshSession();
      
      if (response.error) {
        setError({
          code: 'REFRESH_ERROR',
          message: response.error,
        });
        
        // If refresh fails, redirect to login
        if (response.error.includes('session')) {
          router.push('/login');
        }
      } else if (response.user) {
        setUser(response.user);
        setError(null);
      }
    } catch (err) {
      console.error('Refresh session error:', err);
      setError({
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh session',
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    checkPermission,
    refreshSession: refreshSessionHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user has specific role
 */
export function useRole(requiredRoles: User['role'][]): {
  hasRole: boolean;
  isLoading: boolean;
} {
  const { user, loading } = useAuth();
  
  const hasRole = user ? requiredRoles.includes(user.role) : false;
  
  return {
    hasRole,
    isLoading: loading,
  };
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(module: ModuleType, action: PermissionCheck['action']): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { user, loading, checkPermission } = useAuth();
  
  const hasPermission = checkPermission({ module, action });
  
  return {
    hasPermission,
    isLoading: loading,
  };
}

/**
 * Hook for protected routes
 */
export function useProtectedRoute(requiredRoles?: User['role'][], redirectTo: string = '/login') {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated
        router.push(redirectTo);
      } else if (requiredRoles && !requiredRoles.includes(user.role)) {
        // Not authorized
        router.push('/dashboard/crm');
      } else {
        // Authorized
        setIsAuthorized(true);
      }
    }
  }, [user, loading, requiredRoles, router, redirectTo]);

  return {
    isAuthorized,
    isLoading: loading,
  };
}

/**
 * Hook to check user permissions for a specific resource
 */
export function useResourcePermission(
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): {
  hasPermission: boolean;
  isLoading: boolean;
  checkPermission: () => Promise<boolean>;
} {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissionHandler = useCallback(async () => {
    if (!user) {
      setHasPermission(false);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      const result = await checkUserPermission(
        user.id,
        resourceType,
        action
      );
      setHasPermission(result);
      return result;
    } catch (error) {
      console.error('Failed to check permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, resourceType, resourceId, action]);

  useEffect(() => {
    checkPermissionHandler();
  }, [checkPermissionHandler]);

  return {
    hasPermission,
    isLoading,
    checkPermission: checkPermissionHandler,
  };
}

/**
 * Hook to handle authentication errors
 */
export function useAuthError() {
  const { error } = useAuth();
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      switch (error.code) {
        case 'AUTH001':
          setDisplayError('Invalid email or password');
          break;
        case 'AUTH002':
          setDisplayError('User not found');
          break;
        case 'AUTH003':
          setDisplayError('Your account has been deactivated');
          break;
        case 'AUTH004':
          setDisplayError('Your session has expired. Please login again.');
          break;
        case 'AUTH005':
          setDisplayError('You do not have permission to perform this action');
          break;
        case 'AUTH009':
          setDisplayError('Too many login attempts. Please try again later.');
          break;
        default:
          setDisplayError(error.message || 'An authentication error occurred');
      }
    } else {
      setDisplayError(null);
    }
  }, [error]);

  return {
    error: displayError,
    clearError: () => setDisplayError(null),
  };
}

/**
 * Hook for session management
 */
export function useSession() {
  const { user, refreshSession } = useAuth();
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      // Set up session refresh timer
      const checkSession = setInterval(async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
          const expiresAt = new Date(session.expires_at || Date.now() + 3600000);
          setSessionExpiry(expiresAt);
          
          // Refresh if expiring in less than 5 minutes
          const timeToExpiry = expiresAt.getTime() - Date.now();
          if (timeToExpiry < 5 * 60 * 1000) {
            await refreshSession();
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(checkSession);
    }
  }, [user, refreshSession]);

  return {
    sessionExpiry,
    refreshSession,
  };
}
