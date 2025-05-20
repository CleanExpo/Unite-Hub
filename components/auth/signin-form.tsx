"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaGithub, FaTwitter } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useEmailVerification } from "@/hooks/use-email-verification"
import { verifyTOTP, getTOTPSecret, verifyBackupCode } from "@/lib/two-factor-auth"
import { Shield } from "lucide-react"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [show2FAPrompt, setShow2FAPrompt] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [userId, setUserId] = useState("")
  const [totpSecret, setTotpSecret] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { sendVerificationEmail, isLoading: isVerificationLoading } = useEmailVerification()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if the error is due to email not being verified
        if (error.message.includes("Email not confirmed")) {
          setShowVerificationMessage(true)
          return
        }

        throw error
      }

      // Check if 2FA is enabled for this user
      if (data.user) {
        const twoFactorData = await getTOTPSecret(data.user.id)

        if (twoFactorData && twoFactorData.verified) {
          // Store user ID and TOTP secret for verification
          setUserId(data.user.id)
          setTotpSecret(twoFactorData.secret)
          setShow2FAPrompt(true)
          setIsLoading(false)
          return
        }
      }

      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "An error occurred during sign in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    setIsLoading(true)

    try {
      let isValid = false

      if (useBackupCode) {
        // Verify backup code
        isValid = await verifyBackupCode(userId, backupCode)
      } else {
        // Verify TOTP code
        isValid = verifyTOTP(totpCode, totpSecret)
      }

      if (!isValid) {
        toast({
          title: "Verification Failed",
          description: useBackupCode
            ? "Invalid backup code. Please try again or use a different code."
            : "Invalid verification code. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Complete sign in
      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: "google" | "facebook" | "twitter" | "github") => {
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
        title: "Social Sign In Failed",
        description: error.message || `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const success = await sendVerificationEmail(email)
    if (success) {
      setShowVerificationMessage(false)
    }
  }

  if (show2FAPrompt) {
    return (
      <div className="text-center p-6 bg-[#002a42]/50 rounded-lg border border-[#4ecdc4]/20">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-[#4ecdc4]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Two-Factor Authentication</h2>

        {!useBackupCode ? (
          <>
            <p className="text-gray-300 mb-6">Enter the 6-digit verification code from your authenticator app.</p>

            <div className="mb-6">
              <Input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="bg-[#001428] border-[#4ecdc4]/20 text-white text-center text-xl tracking-widest"
                maxLength={6}
                placeholder="000000"
              />
            </div>

            <Button
              onClick={handleVerify2FA}
              className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white mb-4"
              disabled={isLoading || totpCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>

            <p className="text-gray-400 text-sm">
              <button onClick={() => setUseBackupCode(true)} className="text-[#4ecdc4] hover:underline">
                Use a backup code instead
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-6">Enter one of your backup codes.</p>

            <div className="mb-6">
              <Input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="bg-[#001428] border-[#4ecdc4]/20 text-white text-center font-mono"
                placeholder="XXXX-XXXX"
              />
            </div>

            <Button
              onClick={handleVerify2FA}
              className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white mb-4"
              disabled={isLoading || backupCode.length < 8}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>

            <p className="text-gray-400 text-sm">
              <button onClick={() => setUseBackupCode(false)} className="text-[#4ecdc4] hover:underline">
                Use authenticator app instead
              </button>
            </p>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-[#4ecdc4]/10">
          <button
            onClick={() => {
              setShow2FAPrompt(false)
              setTotpCode("")
              setBackupCode("")
              setUseBackupCode(false)
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (showVerificationMessage) {
    return (
      <div className="text-center p-6 bg-[#002a42]/50 rounded-lg border border-[#4ecdc4]/20">
        <h2 className="text-2xl font-bold text-white mb-4">Email Not Verified</h2>
        <div className="mb-6">
          <p className="text-gray-300 mb-2">Your email address has not been verified yet:</p>
          <p className="text-[#4ecdc4] font-medium">{email}</p>
        </div>
        <p className="text-gray-300 mb-4">
          Please check your inbox for the verification link or click below to resend the verification email.
        </p>
        <Button
          onClick={handleResendVerification}
          className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white mb-4"
          disabled={isVerificationLoading}
        >
          {isVerificationLoading ? "Sending..." : "Resend Verification Email"}
        </Button>
        <p className="text-gray-400 text-sm">
          <button onClick={() => setShowVerificationMessage(false)} className="text-[#4ecdc4] hover:underline">
            Back to Sign In
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSignIn} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <Link href="/auth/forgot-password" className="text-sm font-medium text-[#4ecdc4] hover:underline">
              Forgot Password?
            </Link>
          </div>
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
        <Button type="submit" className="w-full bg-[#4ecdc4] hover:bg-[#3dbdb4] text-white" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
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
          onClick={() => handleSocialSignIn("google")}
          disabled={isLoading}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignIn("facebook")}
          disabled={isLoading}
        >
          <FaFacebook className="mr-2 h-5 w-5 text-blue-600" />
          Facebook
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignIn("twitter")}
          disabled={isLoading}
        >
          <FaTwitter className="mr-2 h-5 w-5 text-blue-400" />
          Twitter
        </Button>
        <Button
          variant="outline"
          className="bg-[#001428] border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
          onClick={() => handleSocialSignIn("github")}
          disabled={isLoading}
        >
          <FaGithub className="mr-2 h-5 w-5" />
          GitHub
        </Button>
      </div>
    </div>
  )
}
