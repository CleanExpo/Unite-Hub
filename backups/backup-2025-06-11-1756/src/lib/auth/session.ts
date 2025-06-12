import { createClient } from '../supabase/server'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Session {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  expires_at: number | null
}

export const createSupabaseServerClient = () => {
  return createClient()
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name,
      role: user.user_metadata?.role,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    }
  } catch (error) {
    return null
  }
}

export const getSession = async (): Promise<Session | null> => {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }
    
    if (!session) {
      return null
    }
    
    return {
      user: session.user ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name,
        role: session.user.user_metadata?.role,
        avatar_url: session.user.user_metadata?.avatar_url,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at
      } : null,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at
    }
  } catch (error) {
    return null
  }
}

export const getUser = async (): Promise<User | null> => {
  const session = await getSession()
  return session?.user || null
}

export const requireAuth = async (): Promise<User> => {
  const user = await getUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const requireRole = async (role: string): Promise<User> => {
  const user = await requireAuth()
  if (user.role !== role) {
    throw new Error('Insufficient permissions')
  }
  return user
}

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession()
  return !!session?.user
}

export const isAdmin = async (): Promise<boolean> => {
  const user = await getUser()
  return user?.role === 'admin'
}
