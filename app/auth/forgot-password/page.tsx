"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send password reset email")
      }

      setIsSubmitted(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      })
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

                {!isSubmitted ? (
                  <>
                    <div className="mb-6 text-center">
                      <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
                      <p className="mt-2 text-gray-300">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-[#001428] border-[#4ecdc4]/20 text-white"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-6">Check Your Email</h2>
                    <p className="text-gray-300 mt-4 mb-6">
                      We've sent a password reset link to <span className="text-[#4ecdc4] font-medium">{email}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                      If you don't see it in your inbox, please check your spam folder.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="bg-transparent border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
                    >
                      <Link href="/auth/signin">Return to Sign In</Link>
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
