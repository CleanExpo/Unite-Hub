"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from the URL
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "signup") {
          setVerificationStatus("error")
          setErrorMessage("Invalid verification link. Please request a new verification email.")
          return
        }

        // Verify the token with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup",
        })

        if (error) {
          throw error
        }

        setVerificationStatus("success")

        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 5000)
      } catch (error: any) {
        console.error("Verification error:", error)
        setVerificationStatus("error")
        setErrorMessage(error.message || "Failed to verify your email. Please try again.")
      }
    }

    handleEmailVerification()
  }, [searchParams, router])

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20 text-center">
                {verificationStatus === "loading" && (
                  <div className="py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ecdc4] mx-auto"></div>
                    <h2 className="text-xl font-semibold text-white mt-6">Verifying your email...</h2>
                    <p className="text-gray-300 mt-2">Please wait while we verify your email address.</p>
                  </div>
                )}

                {verificationStatus === "success" && (
                  <div className="py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-6">Email Verified!</h2>
                    <p className="text-gray-300 mt-4 mb-6">
                      Your email has been successfully verified. You will be redirected to the dashboard in a few
                      seconds.
                    </p>
                    <Button asChild className="bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white">
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                )}

                {verificationStatus === "error" && (
                  <div className="py-8">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-6">Verification Failed</h2>
                    <p className="text-gray-300 mt-4 mb-6">{errorMessage}</p>
                    <div className="space-y-3">
                      <Button asChild className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white">
                        <Link href="/auth/signup">Try Again</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full bg-transparent border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
                      >
                        <Link href="/auth/signin">Sign In</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
