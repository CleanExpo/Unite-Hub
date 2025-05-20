"use client"

import type React from "react"

import { useState } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight } from "lucide-react"

export function PreferencesStep() {
  const { nextStep, prevStep, updatePreferences, preferencesData } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    emailNotifications: preferencesData.emailNotifications ?? true,
    marketingEmails: preferencesData.marketingEmails ?? false,
    theme: preferencesData.theme || "dark",
    language: preferencesData.language || "en",
    timezone: preferencesData.timezone || "Australia/Sydney",
  })

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePreferences(formData)
      nextStep()
    } catch (error) {
      console.error("Error updating preferences:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Set Your Preferences</h2>
        <p className="text-gray-300 mt-2">Customize your experience to match your needs and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
            <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Receive important updates about your account</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={handleSwitchChange("emailNotifications")}
                  className="data-[state=checked]:bg-[#4ecdc4]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Marketing Emails</h4>
                  <p className="text-sm text-gray-400">Receive promotional emails and offers</p>
                </div>
                <Switch
                  checked={formData.marketingEmails}
                  onCheckedChange={handleSwitchChange("marketingEmails")}
                  className="data-[state=checked]:bg-[#4ecdc4]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#001428] p-4 rounded-lg border border-[#4ecdc4]/20">
            <h3 className="text-lg font-medium text-white mb-4">Display Settings</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <Select value={formData.theme} onValueChange={handleSelectChange("theme")}>
                  <SelectTrigger className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <Select value={formData.language} onValueChange={handleSelectChange("language")}>
                  <SelectTrigger className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <Select value={formData.timezone} onValueChange={handleSelectChange("timezone")}>
                  <SelectTrigger className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#001f3d] border-gray-700 text-white">
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                    <SelectItem value="Australia/Perth">Australia/Perth (AWST)</SelectItem>
                    <SelectItem value="Australia/Adelaide">Australia/Adelaide (ACST/ACDT)</SelectItem>
                    <SelectItem value="Australia/Brisbane">Australia/Brisbane (AEST)</SelectItem>
                    <SelectItem value="Australia/Darwin">Australia/Darwin (ACST)</SelectItem>
                    <SelectItem value="Australia/Hobart">Australia/Hobart (AEST/AEDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
