import type { Metadata } from "next"
import { TemplateManagement } from "@/components/social/template-management"

export const metadata: Metadata = {
  title: "Social Media Templates | UNITE Group",
  description: "Create and manage reusable templates for your social media posts.",
}

export default function TemplatesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Social Media Templates</h1>
      <TemplateManagement />
    </div>
  )
}
