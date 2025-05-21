import { createClient } from "@/lib/supabase"
import { PdfExportButton } from "@/components/pdf-export-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ArchitectureProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: project } = await supabase.from("architecture_projects").select("*").eq("id", params.id).single()

  if (!project) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Link href="/dashboard/architecture">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/architecture">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        <PdfExportButton projectId={params.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Business Goals</h3>
                <p className="text-gray-600">{project.businessGoals || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-medium">Target Audience</h3>
                <p className="text-gray-600">{project.targetAudience || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-medium">Key Features</h3>
                <p className="text-gray-600">{project.keyFeatures || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Frontend Framework</h3>
                <p className="text-gray-600">{project.frontendFramework || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-medium">Backend Technology</h3>
                <p className="text-gray-600">{project.backendTechnology || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-medium">Database</h3>
                <p className="text-gray-600">{project.database || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-medium">Hosting</h3>
                <p className="text-gray-600">{project.hosting || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cost Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="font-medium">Development</h3>
                <p className="text-gray-600">${project.developmentCost || "0"}</p>
              </div>
              <div>
                <h3 className="font-medium">Design</h3>
                <p className="text-gray-600">${project.designCost || "0"}</p>
              </div>
              <div>
                <h3 className="font-medium">Hosting</h3>
                <p className="text-gray-600">${project.hostingCost || "0"}</p>
              </div>
              <div>
                <h3 className="font-medium">Maintenance</h3>
                <p className="text-gray-600">${project.maintenanceCost || "0"}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Total Cost</h3>
                <p className="text-xl font-bold">${project.totalCost || "0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
