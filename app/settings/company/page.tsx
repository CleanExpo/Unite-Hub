import type { Metadata } from "next"
import { CompanySettingsForm } from "./company-settings-form"

export const metadata: Metadata = {
  title: "Company Settings",
  description: "Manage your company settings and branding",
}

export default async function CompanySettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company information and branding settings</p>
      </div>

      <div className="grid gap-8">
        <CompanySettingsForm />
      </div>
    </div>
  )
}
