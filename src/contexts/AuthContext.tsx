"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
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
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setCurrentOrganization: (org: UserOrganization) => void;
  refreshProfile: () => Promise<void>;
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
      const { data, error } = await supabaseBrowser
        .from("user_organizations")
        .select(`
          id,
          org_id,
          role,
          organization:organizations(id, name, logo_url)
        `)
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      const orgs = data as any[];
      setOrganizations(orgs);

      // Set current organization (first one or from localStorage)
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const savedOrg = orgs.find((org) => org.org_id === savedOrgId);
      setCurrentOrganization(savedOrg || orgs[0] || null);
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

  // Sign in
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
    // Get initial session
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchOrganizations(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchOrganizations(session.user.id);
      } else {
        setProfile(null);
        setOrganizations([]);
        setCurrentOrganization(null);
      }

      setLoading(false);
    });

    return () => {
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
    signUp,
    signOut,
    setCurrentOrganization: handleSetCurrentOrganization,
    refreshProfile,
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
