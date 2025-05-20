"use client"

import { useState } from "react"
import Image from "next/image"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowRightCircle } from "lucide-react"

export function WelcomeStep() {
  const { nextStep, skipOnboarding } = useOnboarding()
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      await skipOnboarding()
    } catch (error) {
      console.error("Error skipping onboarding:", error)
      setIsSkipping(false)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <Image src="/logo.png" alt="UNITE Group Logo" fill className="object-contain" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white">Welcome to UNITE Group</h1>

      <p className="text-gray-300 max-w-lg mx-auto">
        We're excited to have you join us! Let's take a few moments to set up your account and personalize your
        experience. This will only take about 2 minutes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <div className="h-10 w-10 bg-[#4ecdc4]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
            <ArrowRightCircle className="h-5 w-5 text-[#4ecdc4]" />
          </div>
          <h3 className="font-medium text-white mb-2">Complete Your Profile</h3>
          <p className="text-sm text-gray-400">Add your details so others can get to know you better</p>
        </div>

        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <div className="h-10 w-10 bg-[#4ecdc4]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
            <ArrowRightCircle className="h-5 w-5 text-[#4ecdc4]" />
          </div>
          <h3 className="font-medium text-white mb-2">Set Preferences</h3>
          <p className="text-sm text-gray-400">Customize your experience to match your needs</p>
        </div>

        <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
          <div className="h-10 w-10 bg-[#4ecdc4]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
            <ArrowRightCircle className="h-5 w-5 text-[#4ecdc4]" />
          </div>
          <h3 className="font-medium text-white mb-2">Explore Services</h3>
          <p className="text-sm text-gray-400">Discover the services that best match your interests</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
        <Button
          variant="outline"
          className="border-[#4ecdc4]/50 text-gray-300 hover:bg-[#001428] hover:text-white"
          onClick={handleSkip}
          disabled={isSkipping}
        >
          {isSkipping ? "Skipping..." : "Skip for now"}
        </Button>

        <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]" onClick={nextStep}>
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
