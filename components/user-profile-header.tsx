"use client"

import { useAuthSession } from "@/hooks/use-auth-session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function UserProfileHeader() {
  const { user, isAuthenticated, isLoading } = useAuthSession()

  if (isLoading) {
    return <div className="animate-pulse h-10 w-40 bg-gray-200 rounded"></div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-gray-500">{user.role}</p>
      </div>
      <Avatar>
        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <Button variant="outline" size="sm" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  )
}
