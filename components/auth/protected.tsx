"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

type ProtectedProps = {
  children: ReactNode
  requiredPermission?: { resource: string; action: string }
  requiredRole?: string
  fallback?: ReactNode
}

export function Protected({
  children,
  requiredPermission,
  requiredRole,
  fallback = <div className="text-red-500">You don't have permission to view this content.</div>,
}: ProtectedProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin")
    return null
  }

  // Check permissions
  if (requiredPermission) {
    const { resource, action } = requiredPermission
    if (!hasPermission(resource, action)) {
      return <>{fallback}</>
    }
  }

  // Check roles
  if (requiredRole) {
    if (!hasRole(requiredRole)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
