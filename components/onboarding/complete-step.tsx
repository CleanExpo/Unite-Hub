"use client"

import { useState } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

export function CompleteStep() {
  const { completeOnboarding } = useOnboarding()
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await completeOnboarding()
    } catch (error) {
      console.error("Error completing onboarding:", error)
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-[#4ecdc4]/20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-[#4ecdc4]" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white">You're All Set!</h2>

      <p className="text-gray-300 max-w-lg mx-auto">
        Thank you for completing your profile setup. Your account is now ready to use. We've personalized your
        experience based on your preferences.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <h3 className="font-medium text-white mb-2">Explore Services</h3>
          <p className="text-sm text-gray-400">Discover our range of services tailored to your needs</p>
        </div>

        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <h3 className="font-medium text-white mb-2">View Resources</h3>
          <p className="text-sm text-gray-400">Access educational content and helpful resources</p>
        </div>

        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <h3 className="font-medium text-white mb-2">Get Support</h3>
          <p className="text-sm text-gray-400">Contact our team for assistance with any questions</p>
        </div>
      </div>

      <div className="pt-6">
        <Button
          className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] px-8"
          onClick={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? "Redirecting..." : "Go to Dashboard"}{" "}
          {!isCompleting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
