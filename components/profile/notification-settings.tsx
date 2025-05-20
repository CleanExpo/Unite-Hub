"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getUserPreferences, updateUserPreferences } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"
import { Check } from "lucide-react"

export function NotificationSettings() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    marketing_emails: false,
  })

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return

      setIsLoading(true)
      try {
        const userPrefs = await getUserPreferences(user.id)
        if (userPrefs) {
          setNotifications({
            email_notifications: userPrefs.email_notifications,
            marketing_emails: userPrefs.marketing_emails,
          })
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error)
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  const handleToggle = (field) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserPreferences(user.id, notifications)
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save notification settings",
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
        <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
        <p className="text-gray-300 mb-6">Manage how and when you receive notifications from us.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications" className="text-white">
                Email Notifications
              </Label>
              <p className="text-sm text-gray-400">Receive email updates about your account activity</p>
            </div>
            <Switch
              id="email_notifications"
              checked={notifications.email_notifications}
              onCheckedChange={() => handleToggle("email_notifications")}
              className="data-[state=checked]:bg-[#4ecdc4]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing_emails" className="text-white">
                Marketing Emails
              </Label>
              <p className="text-sm text-gray-400">Receive promotional emails and special offers</p>
            </div>
            <Switch
              id="marketing_emails"
              checked={notifications.marketing_emails}
              onCheckedChange={() => handleToggle("marketing_emails")}
              className="data-[state=checked]:bg-[#4ecdc4]"
            />
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
                <Check className="mr-2 h-4 w-4" /> Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
