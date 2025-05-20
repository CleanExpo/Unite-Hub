"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useEmailVerification() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendVerificationEmail = async (email: string) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification email")
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendVerificationEmail,
    isLoading,
  }
}
