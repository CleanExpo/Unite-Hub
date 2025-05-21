import { useSession } from "next-auth/react"

// Define the extended session type
interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  permissions?: string[]
}

interface ExtendedSession {
  user: ExtendedUser
  expires: string
}

export function useAuthSession() {
  const { data: session, status, update } = useSession()

  return {
    session: session as ExtendedSession | null,
    status,
    update,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user as ExtendedUser | undefined,
    hasPermission: (permission: string) => {
      return session?.user?.permissions?.includes(permission) || false
    },
    hasRole: (role: string) => {
      return session?.user?.role === role
    },
  }
}
