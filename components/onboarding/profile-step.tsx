"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Upload } from "lucide-react"

export function ProfileStep() {
  const { user } = useAuth()
  const { nextStep, prevStep, updateProfile, profileData } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profileData.fullName || user?.user_metadata?.full_name || "",
    jobTitle: profileData.jobTitle || "",
    company: profileData.company || "",
    bio: profileData.bio || "",
    avatarUrl: profileData.avatarUrl || user?.user_metadata?.avatar_url || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateProfile(formData)
      nextStep()
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
        <p className="text-gray-300 mt-2">Tell us a bit about yourself so we can personalize your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full bg-[#001428] border-2 border-[#4ecdc4]/30 overflow-hidden mb-3">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl || "/placeholder.svg"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#4ecdc4]">
                <Upload className="h-8 w-8" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs border-[#4ecdc4]/30 text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
          >
            Upload Photo
          </Button>
          <p className="text-xs text-gray-400 mt-2">Optional: Add a profile picture</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name*
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-1">
              Job Title
            </label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
              Company
            </label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-[#4ecdc4]/50 text-gray-300 hover:bg-[#001428] hover:text-white"
            onClick={prevStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button type="submit" className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Continue"} {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
