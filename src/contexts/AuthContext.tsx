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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string, providedSession?: Session | null) => {
    try {
      console.log('[AuthContext] fetchProfile starting...');

      // Use provided session or get current session
      let currentSession = providedSession;
      if (!currentSession) {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        currentSession = session;
      }

      if (!currentSession) {
        console.error('[AuthContext] No session available for profile fetch - RLS will block the query');
        return;
      }
      console.log('[AuthContext] Session confirmed, fetching profile...');

      const { data, error } = await Promise.race([
        supabaseBrowser.from("user_profiles").select("*").eq("id", userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 15000))
      ]) as any;

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error);
        return;
      }
      console.log('[AuthContext] Profile fetched:', data?.email);
      setProfile(data);
    } catch (error) {
      console.error("[AuthContext] Error fetching profile:", error);
    }
  };

  // Fetch user organizations
  const fetchOrganizations = async (userId: string, providedSession?: Session | null) => {
    try {
      console.log('[AuthContext] fetchOrganizations starting...');

      // Use provided session or get current session
      let currentSession = providedSession;
      if (!currentSession) {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        currentSession = session;
      }

      if (!currentSession) {
        console.error('[AuthContext] No session available for organizations fetch - RLS will block the query');
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }
      console.log('[AuthContext] Session confirmed, fetching organizations...');

      // Add timeout to organizations fetch
      const { data: userOrgs, error: userOrgsError } = await Promise.race([
        supabaseBrowser
          .from("user_organizations")
          .select("id, org_id, role, joined_at")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("joined_at", { ascending: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Organizations fetch timeout')), 15000))
      ]) as any;

      if (userOrgsError) {
        console.error("[AuthContext] Error fetching user organizations:", userOrgsError);
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      if (!userOrgs || userOrgs.length === 0) {
        console.log("[AuthContext] No organizations found for user");
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      console.log(`[AuthContext] Found ${userOrgs.length} user organizations`);

      // Get organization details for each org_id
      const orgIds = userOrgs.map((uo: any) => uo.org_id);
      const { data: orgsData, error: orgsError } = await Promise.race([
        supabaseBrowser.from("organizations").select("id, name").in("id", orgIds),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Org details fetch timeout')), 15000))
      ]) as any;

      if (orgsError) {
        console.error("[AuthContext] Error fetching org details:", orgsError);
        // Continue with limited data
      }

      // Combine the data
      const orgs = userOrgs.map((userOrg: any) => ({
        id: userOrg.id,
        org_id: userOrg.org_id,
        role: userOrg.role,
        organization: orgsData?.find((o: any) => o.id === userOrg.org_id) || {
          id: userOrg.org_id,
          name: "Unknown Organization",
          logo_url: null
        }
      }));

      console.log('[AuthContext] Organizations processed:', orgs.length);
      setOrganizations(orgs);

      // Set current organization
      const savedOrgId = localStorage.getItem("currentOrganizationId");
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

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { data, error} = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/implicit-callback`,
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
    localStorage.removeItem("currentOrganizationId");
  };

  // Handle organization change
  const handleSetCurrentOrganization = (org: UserOrganization) => {
    setCurrentOrganization(org);
    localStorage.setItem("currentOrganizationId", org.org_id);
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    console.log('[AuthContext] Initializing auth state...');

    // Safety timeout: If loading doesn't complete in 20 seconds, force it to false
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthContext] ⚠️ SAFETY TIMEOUT REACHED - FORCING LOADING = FALSE');
        setLoading(false);
      }
    }, 20000); // 20 second timeout (increased to allow slow DB queries)

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

              // Check if onboarding is needed (optional - skip if table doesn't exist)
              try {
                const { data: onboardingStatus, error: onboardingError } = await supabaseBrowser
                  .from('user_onboarding')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (onboardingError) {
                  console.log('[AuthContext] Onboarding table not found or error:', onboardingError.message);
                  // Continue anyway - onboarding is optional
                } else if (onboardingStatus && !onboardingStatus.completed_at && !onboardingStatus.skipped) {
                  console.log('[AuthContext] Redirecting to onboarding...');
                  window.location.href = '/onboarding';
                  return;
                }
              } catch (onboardingErr) {
                console.log('[AuthContext] Skipping onboarding check:', onboardingErr);
                // Continue anyway
              }

              // Done initializing, stop loading
              console.log('[AuthContext] SIGNED_IN handling complete, setting loading = false');
              setLoading(false);
              return; // Exit early, don't fetch again below
            }
          } catch (error) {
            console.error('[AuthContext] Error initializing user:', error);
            // Even on error, set loading to false to prevent infinite loading
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
