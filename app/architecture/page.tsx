"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ArchitectureRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the architecture capture form
    router.push("/dashboard/architecture/new")
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Redirecting to architecture form...</p>
      </div>
    </div>
  )
}
