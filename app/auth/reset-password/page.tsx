"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get the token from the URL
  const token = searchParams.get("token")

  useEffect(() => {
    // Validate the token when the component mounts
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false)
        setError("Invalid or missing reset token. Please request a new password reset link.")
        return
      }

      try {
        // Verify the token with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        })

        if (error) {
          throw error
        }

        setIsTokenValid(true)
      } catch (error: any) {
        console.error("Token validation error:", error)
        setIsTokenValid(false)
        setError(error.message || "Invalid or expired reset token. Please request a new password reset link.")
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Update the password with Supabase
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setIsSubmitted(true)

      // Redirect to sign in page after a delay
      setTimeout(() => {
        router.push("/auth/signin")
      }, 5000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20">
                <div className="mb-6">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center text-sm text-[#4ecdc4] hover:text-[#3dbdb4]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>

                {isTokenValid === null ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ecdc4] mx-auto"></div>
                    <p className="text-gray-300 mt-4">Validating your reset link...</p>
                  </div>
                ) : isTokenValid === false ? (
                  <div className="text-center py-6">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-6">Invalid Reset Link</h2>
                    <p className="text-gray-300 mt-4 mb-6">{error}</p>
                    <Button asChild className="bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white">
                      <Link href="/auth/forgot-password">Request New Reset Link</Link>
                    </Button>
                  </div>
                ) : !isSubmitted ? (
                  <>
                    <div className="mb-6 text-center">
                      <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
                      <p className="mt-2 text-gray-300">Please enter your new password below.</p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-300">
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-[#001428] border-[#4ecdc4]/20 text-white pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">Password must be at least 8 characters long</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-300">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="bg-[#001428] border-[#4ecdc4]/20 text-white pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-6">Password Reset Successful</h2>
                    <p className="text-gray-300 mt-4 mb-6">
                      Your password has been successfully reset. You will be redirected to the sign in page shortly.
                    </p>
                    <Button asChild className="bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white">
                      <Link href="/auth/signin">Sign In Now</Link>
                    </Button>
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
