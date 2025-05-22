import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, User, Key, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
  description: "Manage your admin settings",
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Error Notifications
            </CardTitle>
            <CardDescription>Manage your error notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure how you receive notifications about system errors and critical events.
            </p>
            <Button asChild>
              <Link href="/admin/settings/notifications">Error Notification Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Assignment Notifications
            </CardTitle>
            <CardDescription>Manage your assignment notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure how you receive notifications about error assignments and status changes.
            </p>
            <Button asChild>
              <Link href="/admin/settings/assignment-notifications">Assignment Notification Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your personal information, email address, and profile settings.
            </p>
            <Button asChild>
              <Link href="/admin/settings/profile">Profile Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your password, enable two-factor authentication, and manage security settings.
            </p>
            <Button asChild>
              <Link href="/admin/settings/security">Security Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
