import type { Metadata } from "next"
import NotificationSettings from "@/components/admin/notification-settings"

export const metadata: Metadata = {
  title: "Notification Settings | Admin Dashboard",
  description: "Manage your notification preferences",
}

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
      <NotificationSettings />
    </div>
  )
}
