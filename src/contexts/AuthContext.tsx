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
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseBrowser
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Fetch user organizations
  const fetchOrganizations = async (userId: string) => {
    try {
      // First get user_organizations
      const { data: userOrgs, error: userOrgsError } = await supabaseBrowser
        .from("user_organizations")
        .select("id, org_id, role, joined_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("joined_at", { ascending: false });

      if (userOrgsError) {
        console.error("Error fetching user organizations:", userOrgsError);
        throw userOrgsError;
      }

      if (!userOrgs || userOrgs.length === 0) {
        console.log("No organizations found for user. This might be a new user being initialized.");
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      // Get organization details for each org_id
      const orgIds = userOrgs.map(uo => uo.org_id);
      const { data: orgsData, error: orgsError } = await supabaseBrowser
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);

      if (orgsError) throw orgsError;

      // Combine the data
      const orgs = userOrgs.map(userOrg => ({
        id: userOrg.id,
        org_id: userOrg.org_id,
        role: userOrg.role,
        organization: orgsData?.find(o => o.id === userOrg.org_id) || {
          id: userOrg.org_id,
          name: "Unknown Organization",
          logo_url: null
        }
      }));

      setOrganizations(orgs);

      // Set current organization (first one or from localStorage)
      if (orgs.length === 0) {
        console.log("No organizations found for user");
        setCurrentOrganization(null);
        return;
      }

      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const savedOrg = orgs.find((org) => org.org_id === savedOrgId);
      setCurrentOrganization(savedOrg || orgs[0]);  // ✅ Now guaranteed to be an org (not undefined)
    } catch (error) {
      console.error("Error fetching organizations:", error);
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

    // Safety timeout: If loading doesn't complete in 10 seconds, force it to false
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthContext] Safety timeout reached - forcing loading = false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

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

        // Fetch user data
        console.log('[AuthContext] Fetching profile and organizations...');
        await fetchProfile(session.user.id);
        await fetchOrganizations(session.user.id);
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
            const response = await fetch('/api/auth/initialize-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
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

              // Fetch user data AFTER initialization completes
              console.log('[AuthContext] Fetching profile and organizations after init...');
              await fetchProfile(session.user.id);
              await fetchOrganizations(session.user.id);
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

        // Fetch/refresh user data on any auth event (except SIGNED_IN which handles above)
        console.log('[AuthContext] Fetching profile and organizations for event:', event);
        await fetchProfile(session.user.id);
        await fetchOrganizations(session.user.id);
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
