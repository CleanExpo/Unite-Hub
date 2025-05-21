import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#001428] border border-[#4ecdc4]/20 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-16 w-16 text-[#4ecdc4]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-300 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an
          error.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
