"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase";
import { hasPermission, Permission, UserRole } from "@/lib/permissions";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  username?: string;
  business_name?: string;
  phone?: string;
  bio?: string;
  website?: string;
  timezone?: string;
  notification_preferences?: {
    email_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
    weekly_digest: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface UserOrganization {
  id: string;
  org_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  organizations: UserOrganization[];
  currentOrganization: UserOrganization | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setCurrentOrganization: (org: UserOrganization) => void;
  refreshProfile: () => Promise<void>;
  // Role utilities
  hasPermission: (permission: Permission) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isAdminOrOwner: () => boolean;
  getRole: () => UserRole | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for testing purposes
export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile via API (bypasses RLS issues)
  const fetchProfile = async (userId: string, providedSession?: Session | null) => {
    try {
      console.log('[AuthContext] fetchProfile starting via API...');

      // Use provided session or get current session
      let currentSession = providedSession;
      if (!currentSession) {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        currentSession = session;
      }

      if (!currentSession) {
        console.error('[AuthContext] No session available for profile fetch');
        return;
      }

      console.log('[AuthContext] Session confirmed, fetching profile via API...');

      // Use API route with service role to avoid RLS issues
      const response = await fetch(`/api/profile?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      if (!response.ok) {
        console.error('[AuthContext] Profile fetch failed:', response.status);
        return;
      }

      const data = await response.json();

      // Handle null response (no profile exists yet)
      if (!data) {
        console.warn('[AuthContext] No profile found for user:', userId);
        setProfile(null);
        return;
      }

      console.log('[AuthContext] Profile fetched:', data.email);
      setProfile(data);
    } catch (error) {
      console.error("[AuthContext] Error fetching profile:", error);
    }
  };

  // Fetch user organizations via API (bypasses RLS issues)
  const fetchOrganizations = async (userId: string, providedSession?: Session | null) => {
    try {
      console.log('[AuthContext] fetchOrganizations starting via API...');

      // Use provided session or get current session
      let currentSession = providedSession;
      if (!currentSession) {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        currentSession = session;
      }

      if (!currentSession) {
        console.error('[AuthContext] No session available for organizations fetch');
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      console.log('[AuthContext] Session confirmed, fetching organizations via API...');

      // Use API route with service role to avoid RLS issues
      const response = await fetch(`/api/organizations?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      if (!response.ok) {
        console.error('[AuthContext] Organizations fetch failed:', response.status);
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      const orgs = await response.json();
      console.log('[AuthContext] Organizations fetched:', orgs.length);
      setOrganizations(orgs);

      // Handle empty organizations array explicitly
      if (orgs.length === 0) {
        console.warn('[AuthContext] No organizations found for user');
        setCurrentOrganization(null);
        // Don't set loading to false yet - let the layout handle it
        return;
      }

      // Set current organization (with SSR guard)
      let savedOrgId: string | null = null;
      if (typeof window !== 'undefined') {
        savedOrgId = localStorage.getItem("currentOrganizationId");
      }
      const savedOrg = orgs.find((org: any) => org.org_id === savedOrgId);
      const currentOrg = savedOrg || orgs[0] || null;
      console.log('[AuthContext] Current org set to:', currentOrg?.organization?.name);
      setCurrentOrganization(currentOrg);
    } catch (error) {
      console.error("[AuthContext] Error fetching organizations:", error);
      setOrganizations([]);
      setCurrentOrganization(null);
    }
  };

  // Refresh profile and organizations
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchOrganizations(user.id);
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  // Sign in with Google OAuth (PKCE flow)
  const signInWithGoogle = async () => {
    const { data, error} = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // PKCE flow: redirect to server-side callback that exchanges code for session
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  // Sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  // Sign out
  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganizations([]);
    setCurrentOrganization(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("currentOrganizationId");
    }
  };

  // Handle organization change
  const handleSetCurrentOrganization = (org: UserOrganization) => {
    setCurrentOrganization(org);
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentOrganizationId", org.org_id);
    }
  };

  // Session refresh handler (prevents session expiry)
  useEffect(() => {
    const checkAndRefreshSession = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (session) {
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiresAt || 0) - now;

        // If session expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          console.log('[AuthContext] Session expiring soon, refreshing...');
          const { data, error } = await supabaseBrowser.auth.refreshSession();

          if (error) {
            console.error('[AuthContext] Session refresh failed:', error);
            // Redirect to login on failed refresh
            await signOut();
            window.location.href = '/login';
          } else {
            console.log('[AuthContext] Session refreshed successfully');
            setSession(data.session);
          }
        }
      }
    };

    // Check session every 4 minutes
    const intervalId = setInterval(checkAndRefreshSession, 4 * 60 * 1000);

    // Check immediately on mount
    checkAndRefreshSession();

    return () => clearInterval(intervalId);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    console.log('[AuthContext] Initializing auth state...');

    // Safety timeout: If loading doesn't complete in 8 seconds, force it to false
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthContext] ⚠️ SAFETY TIMEOUT REACHED - FORCING LOADING = FALSE');
        setLoading(false);
      }
    }, 8000); // 8 second timeout - more reasonable for better UX

    // Get initial session from localStorage (persisted session)
    supabaseBrowser.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
        return;
      }

      if (session) {
        console.log('[AuthContext] Restored session from storage for:', session.user.email);
        setSession(session);
        setUser(session.user);

        // Fetch user data - pass session explicitly
        console.log('[AuthContext] Fetching profile and organizations...');
        await fetchProfile(session.user.id, session);
        await fetchOrganizations(session.user.id, session);
        console.log('[AuthContext] Profile and organizations fetched');
      } else {
        console.log('[AuthContext] No session found in storage');
      }

      console.log('[AuthContext] Initial load complete, setting loading = false');
      clearTimeout(safetyTimeout);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state change:', event, session?.user?.email);

      // Handle explicit SIGNED_OUT event (session expiry or manual logout)
      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, redirecting to login');
        setSession(null);
        setUser(null);
        setProfile(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem("currentOrganizationId");
          // Redirect to login page to prevent broken state
          window.location.href = '/login';
        }
        return; // Early return to prevent further processing
      }

      // Handle token refresh event
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] Token refreshed, updating session');
        setSession(session);
        setUser(session?.user ?? null);
        // Don't need to re-fetch profile/orgs on refresh
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // For SIGNED_IN event (first login), initialize user profile and organization
        if (event === 'SIGNED_IN') {
          try {
            console.log('[AuthContext] SIGNED_IN event detected, initializing user...');

            // Get the access token to pass to API (needed for implicit OAuth flow)
            const accessToken = session.access_token;

            const response = await fetch('/api/auth/initialize-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Pass token for implicit flow
              },
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[AuthContext] Failed to initialize user:', errorText);
            } else {
              const result = await response.json();
              console.log('[AuthContext] User initialized successfully:', result);

              // Wait a moment for database to propagate changes
              console.log('[AuthContext] Waiting for DB propagation...');
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Fetch user data AFTER initialization completes - pass session explicitly
              console.log('[AuthContext] Fetching profile and organizations after init...');
              await fetchProfile(session.user.id, session);
              await fetchOrganizations(session.user.id, session);
              console.log('[AuthContext] Post-init fetch complete');

              // Skip onboarding check for now (can add later if needed)
              console.log('[AuthContext] Skipping onboarding check (disabled)');

              // Done initializing, stop loading
              console.log('[AuthContext] SIGNED_IN handling complete, setting loading = false');
              clearTimeout(safetyTimeout);
              setLoading(false);
              return; // Exit early, don't fetch again below
            }
          } catch (error) {
            console.error('[AuthContext] Error initializing user:', error);
            // Even on error, set loading to false to prevent infinite loading
            clearTimeout(safetyTimeout);
            setLoading(false);
          }
        }

        // Fetch/refresh user data on any auth event (except SIGNED_IN which handles above) - pass session explicitly
        console.log('[AuthContext] Fetching profile and organizations for event:', event);
        await fetchProfile(session.user.id, session);
        await fetchOrganizations(session.user.id, session);
        console.log('[AuthContext] Fetch complete for event:', event);
      } else {
        // Clear user data on sign out
        console.log('[AuthContext] No session, clearing user data');
        setProfile(null);
        setOrganizations([]);
        setCurrentOrganization(null);
      }

      console.log('[AuthContext] Auth state change handling complete, setting loading = false');
      clearTimeout(safetyTimeout);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    organizations,
    currentOrganization,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    setCurrentOrganization: handleSetCurrentOrganization,
    refreshProfile,
    // Role utilities
    hasPermission: (permission: Permission) => {
      const role = currentOrganization?.role;
      return hasPermission(role, permission);
    },
    isOwner: () => currentOrganization?.role === 'owner',
    isAdmin: () => currentOrganization?.role === 'admin',
    isAdminOrOwner: () => {
      const role = currentOrganization?.role;
      return role === 'owner' || role === 'admin';
    },
    getRole: () => currentOrganization?.role as UserRole | undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
