import type { Metadata } from "next"
import AssignmentNotificationSettings from "@/components/admin/assignment-notification-settings"

export const metadata: Metadata = {
  title: "Assignment Notification Settings | Admin Dashboard",
  description: "Manage your assignment notification preferences",
}

export default function AssignmentNotificationSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Assignment Notification Settings</h1>
      <AssignmentNotificationSettings />
    </div>
  )
}
