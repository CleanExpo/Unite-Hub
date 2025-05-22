"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a192f]">
        <div className="max-w-md w-full space-y-8 bg-[#112240] p-8 rounded-lg border border-[#1a2f55]">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-[#64ffda]/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#64ffda]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">Registration Successful!</h2>
            <p className="mt-2 text-[#64ffda]">Please check your email for a verification link.</p>
            <p className="mt-4 text-sm text-gray-400">Redirecting to login page in 3 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0a192f]">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Image src="/images/unite-logo.png" alt="UNITE Group Logo" width={64} height={64} />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-[#64ffda]">
            Or{" "}
            <Link href="/login" className="font-medium hover:text-[#4fd8b8] transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-md">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 bg-[#112240] text-white placeholder-gray-400 border border-[#1a2f55] focus:outline-none focus:ring-[#64ffda] focus:border-[#64ffda] focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 bg-[#112240] text-white placeholder-gray-400 border border-[#1a2f55] focus:outline-none focus:ring-[#64ffda] focus:border-[#64ffda] focus:z-10 sm:text-sm"
                placeholder="Password (min 6 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 bg-[#112240] text-white placeholder-gray-400 border border-[#1a2f55] focus:outline-none focus:ring-[#64ffda] focus:border-[#64ffda] focus:z-10 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-[#0a192f] bg-[#64ffda] hover:bg-[#4fd8b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#64ffda] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-400">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-[#64ffda] hover:text-[#4fd8b8]">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#64ffda] hover:text-[#4fd8b8]">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  )
}
