"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Role, Permission } from "@/types/rbac"
import { getUserRoles, getUserPermissions } from "@/lib/rbac"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  roles: Role[]
  permissions: Permission[]
  hasRole: (roleName: string) => boolean
  hasPermission: (resource: string, action: string) => boolean
  signIn: (provider: "google" | "facebook" | "twitter" | "github") => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch user roles and permissions
          const userRoles = await getUserRoles(session.user.id)
          const userPermissions = await getUserPermissions(session.user.id)

          setRoles(userRoles)
          setPermissions(userPermissions)
        }
      } catch (error) {
        console.error("Unexpected error during getSession:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user roles and permissions
        const userRoles = await getUserRoles(session.user.id)
        const userPermissions = await getUserPermissions(session.user.id)

        setRoles(userRoles)
        setPermissions(userPermissions)
      } else {
        setRoles([])
        setPermissions([])
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const hasRoleCheck = (roleName: string): boolean => {
    return roles.some((role) => role.name === roleName)
  }

  const hasPermissionCheck = (resource: string, action: string): boolean => {
    return permissions.some((permission) => permission.resource === resource && permission.action === action)
  }

  const signIn = async (provider: "google" | "facebook" | "twitter" | "github") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Error signing in with OAuth:", error)
        throw error
      }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
        throw error
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error)
      throw error
    }
  }

  const value = {
    user,
    session,
    isLoading,
    roles,
    permissions,
    hasRole: hasRoleCheck,
    hasPermission: hasPermissionCheck,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
