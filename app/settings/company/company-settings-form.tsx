"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

export function CompanySettingsForm() {
  const [companyName, setCompanyName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSaveSettings = async () => {
    setLoading(true)
    // Placeholder save logic
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Update your company details and logo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            placeholder="Enter your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-description">Company Description</Label>
          <Textarea
            id="company-description"
            placeholder="Brief description of your company"
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
          {!loading && <Save className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  )
}
