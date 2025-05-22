"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2 } from "lucide-react"

interface NotificationSettings {
  id: number
  user_id: string
  assignment_notifications: boolean
  status_change_notifications: boolean
}

export default function AssignmentNotificationSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          console.error("Error fetching user:", userError)
          return
        }

        setUserId(userData.user.id)

        // Get notification settings
        const { data, error } = await supabase
          .from("admin_notification_settings")
          .select("*")
          .eq("user_id", userData.user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "No rows found" error, which is expected if the user doesn't have settings yet
          console.error("Error fetching notification settings:", error)
        }

        if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error("Error in fetchUserAndSettings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndSettings()
  }, [])

  const saveSettings = async () => {
    if (!userId) return

    setSaving(true)
    try {
      const supabase = createClient()

      const settingsData = {
        user_id: userId,
        email_notifications: settings?.email_notifications ?? true,
        email_critical_only: settings?.email_critical_only ?? true,
        assignment_notifications: settings?.assignment_notifications ?? true,
        status_change_notifications: settings?.status_change_notifications ?? true,
      }

      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase.from("admin_notification_settings").update(settingsData).eq("id", settings.id)

        if (error) {
          throw error
        }
      } else {
        // Create new settings
        const { data, error } = await supabase.from("admin_notification_settings").insert(settingsData).select()

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setSettings(data[0])
        }
      }

      toast({
        title: "Settings saved",
        description: "Your assignment notification preferences have been updated.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your notification preferences.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAssignmentNotifications = (checked: boolean) => {
    setSettings((prev) => (prev ? { ...prev, assignment_notifications: checked } : null))
  }

  const handleToggleStatusChangeNotifications = (checked: boolean) => {
    setSettings((prev) => (prev ? { ...prev, status_change_notifications: checked } : null))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Notification Settings</CardTitle>
        <CardDescription>Configure how you receive notifications about error assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="assignment-notifications">Assignment Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email notifications when errors are assigned to you</p>
          </div>
          <Switch
            id="assignment-notifications"
            checked={settings?.assignment_notifications ?? true}
            onCheckedChange={handleToggleAssignmentNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="status-change-notifications">Status Change Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications when the status of your assignments changes
            </p>
          </div>
          <Switch
            id="status-change-notifications"
            checked={settings?.status_change_notifications ?? true}
            onCheckedChange={handleToggleStatusChangeNotifications}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
