"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserPreferences, updateUserPreferences } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"
import { Check } from "lucide-react"

export function AccountSettings() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "en",
    timezone: "Australia/Sydney",
  })

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return

      setIsLoading(true)
      try {
        const userPrefs = await getUserPreferences(user.id)
        if (userPrefs) {
          setPreferences({
            theme: userPrefs.theme || "dark",
            language: userPrefs.language || "en",
            timezone: userPrefs.timezone || "Australia/Sydney",
          })
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
        toast({
          title: "Error",
          description: "Failed to load account settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  const handleThemeChange = (value) => {
    setPreferences((prev) => ({ ...prev, theme: value }))
  }

  const handleLanguageChange = (value) => {
    setPreferences((prev) => ({ ...prev, language: value }))
  }

  const handleTimezoneChange = (value) => {
    setPreferences((prev) => ({ ...prev, timezone: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserPreferences(user.id, preferences)
      toast({
        title: "Settings Updated",
        description: "Your account settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save account settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4ecdc4]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
        <p className="text-gray-300 mb-6">Manage your account preferences and settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">
              Theme
            </label>
            <Select value={preferences.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="bg-[#001428] border-gray-700 text-white">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">
              Language
            </label>
            <Select value={preferences.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#001428] border-gray-700 text-white">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-1">
              Timezone
            </label>
            <Select value={preferences.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-[#001428] border-gray-700 text-white">
                <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                <SelectItem value="Australia/Adelaide">Australia/Adelaide</SelectItem>
                <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-[#001428] border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
