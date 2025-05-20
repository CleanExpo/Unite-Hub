"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaGithub, FaTwitter } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "You must agree to the terms and privacy policy to create an account.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      })

      if (error) {
        throw error
      }

      // Check if email confirmation is required
      if (data?.user && data.user.identities?.length === 0) {
        toast({
          title: "Account Already Exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        })
        router.push("/auth/signin")
        return
      }

      setVerificationSent(true)

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: "google" | "facebook" | "twitter" | "github") => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      toast({
        title: "Social Sign Up Failed",
        description: error.message || `Failed to sign up with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="text-center p-6 bg-[#002a42]/50 rounded-lg border border-[#4ecdc4]/20">
        <h2 className="text-2xl font-bold text-white mb-4">Verification Email Sent</h2>
        <div className="mb-6">
          <p className="text-gray-300 mb-2">We've sent a verification email to:</p>
          <p className="text-[#4ecdc4] font-medium">{email}</p>
        </div>
        <p className="text-gray-300 mb-4">
          Please check your inbox and click the verification link to complete your registration.
        </p>
        <p className="text-gray-400 text-sm">
          If you don't see the email, check your spam folder or{" "}
          <button onClick={handleSignUp} className="text-[#4ecdc4] hover:underline" disabled={isLoading}>
            click here to resend
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-300">
            Full Name
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-[#001428] border-[#4ecdc4]/20 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">
            Email
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
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-[#001428] border-[#4ecdc4]/20 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-300">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-[#001428] border-[#4ecdc4]/20 text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
          >
            I agree to the{" "}
            <a href="/terms" className="text-[#4ecdc4] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-[#4ecdc4] hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>
        <Button type="submit" className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#4ecdc4]/20"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#002a42] px-2 text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignUp("google")}
          disabled={isLoading}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignUp("facebook")}
          disabled={isLoading}
        >
          <FaFacebook className="mr-2 h-5 w-5 text-blue-600" />
          Facebook
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignUp("twitter")}
          disabled={isLoading}
        >
          <FaTwitter className="mr-2 h-5 w-5 text-blue-400" />
          Twitter
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignUp("github")}
          disabled={isLoading}
        >
          <FaGithub className="mr-2 h-5 w-5" />
          GitHub
        </Button>
      </div>
    </div>
  )
}
