"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, FileText, Users, DollarSign, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PDFExportButton } from "@/components/pdf-export-button"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"

interface ArchitectureProjectDetail {
  id: string
  name: string
  status: "draft" | "paid" | "in_progress" | "completed"
  createdAt: string
  updatedAt: string
  meetingDate?: string
  deliveryDate?: string
  totalPoints?: number
  totalHours?: number
  budget?: number
  roadmap?: {
    mvp: {
      features: Array<{
        name: string
        description: string
        priority: string
        complexity: string
        points: number
        hours: number
      }>
    }
    future: {
      features: Array<{
        name: string
        description: string
        priority: string
        complexity: string
        points: number
        hours: number
      }>
    }
    integrations: Array<{
      name: string
      purpose: string
      apiDocumentation?: string
    }>
  }
  personas?: Array<{
    name: string
    role: string
    goals: string
    painPoints: string
  }>
  technicalConstraints?: string
  businessConstraints?: string
  preferredTechnologies?: string
  realityCheck?: string
}

export default function ArchitectureProjectDetail() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<ArchitectureProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        const response = await fetch(`/api/architecture/projects/${projectId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch project details")
        }
        const data = await response.json()
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project details")
        // For demo purposes, set sample data
        setProject(getSampleProjectDetail(projectId))
      } finally {
        setLoading(false)
      }
    }

    fetchProjectDetails()
  }, [projectId])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled"
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-amber-100 text-amber-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-amber-100 text-amber-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "xs":
        return "bg-green-100 text-green-800"
      case "s":
        return "bg-blue-100 text-blue-800"
      case "m":
        return "bg-amber-100 text-amber-800"
      case "l":
        return "bg-orange-100 text-orange-800"
      case "xl":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
      case "draft":
        return 10
      case "paid":
        return 30
      case "in_progress":
        return 70
      case "completed":
        return 100
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">Error: {error}</div>
        <Button asChild>
          <Link href="/dashboard/architecture">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">Project not found</div>
        <Button asChild>
          <Link href="/dashboard/architecture">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/architecture">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status === "in_progress"
                ? "In Progress"
                : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
          <p className="text-gray-500">Project ID: {project.id}</p>
        </div>
        <div className="flex gap-2">
          <PDFPreviewModal projectId={project.id} projectName={project.name} />
          <PDFExportButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Consultation</span>
                <span>{formatDate(project.meetingDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span>{formatDate(project.deliveryDate)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Progress</span>
                  <span>{getProgressValue(project.status)}%</span>
                </div>
                <Progress value={getProgressValue(project.status)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-500">Story Points</span>
                </div>
                <span>{project.totalPoints || "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-500">Estimated Hours</span>
                </div>
                <span>{project.totalHours || "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-500">Personas</span>
                </div>
                <span>{project.personas?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-500">Budget</span>
                </div>
                <span>{project.budget ? `$${project.budget.toLocaleString()}` : "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blueprint Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                {project.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5"></div>
                )}
                <div>
                  <p className="font-medium">Blueprint Completed</p>
                  <p className="text-sm text-gray-500">Detailed architecture document</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                {project.status === "completed" || project.status === "in_progress" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5"></div>
                )}
                <div>
                  <p className="font-medium">Consultation Completed</p>
                  <p className="text-sm text-gray-500">Initial project discussion</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                {project.status === "completed" || project.status === "in_progress" || project.status === "paid" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5"></div>
                )}
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-gray-500">Blueprint fee processed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {project.realityCheck && (
        <Card className="mb-8 border-amber-200">
          <CardHeader className="bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle>Reality Check</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p>{project.realityCheck}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MVP Features</CardTitle>
              <CardDescription>Core features for the minimum viable product</CardDescription>
            </CardHeader>
            <CardContent>
              {project.roadmap?.mvp.features.length === 0 ? (
                <p className="text-gray-500">No MVP features defined yet.</p>
              ) : (
                <div className="space-y-6">
                  {project.roadmap?.mvp.features.map((feature, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row justify-between md:items-center mb-3 gap-2">
                        <h3 className="font-medium text-lg">{feature.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getPriorityColor(feature.priority)}>
                            {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)} Priority
                          </Badge>
                          <Badge className={getComplexityColor(feature.complexity)}>
                            {feature.complexity.toUpperCase()} Complexity
                          </Badge>
                          <Badge variant="outline">{feature.points} Points</Badge>
                          <Badge variant="outline">{feature.hours} Hours</Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{feature.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future Features</CardTitle>
              <CardDescription>Features planned for future development</CardDescription>
            </CardHeader>
            <CardContent>
              {!project.roadmap?.future.features || project.roadmap.future.features.length === 0 ? (
                <p className="text-gray-500">No future features defined yet.</p>
              ) : (
                <div className="space-y-6">
                  {project.roadmap.future.features.map((feature, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row justify-between md:items-center mb-3 gap-2">
                        <h3 className="font-medium text-lg">{feature.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getPriorityColor(feature.priority)}>
                            {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)} Priority
                          </Badge>
                          <Badge className={getComplexityColor(feature.complexity)}>
                            {feature.complexity.toUpperCase()} Complexity
                          </Badge>
                          <Badge variant="outline">{feature.points} Points</Badge>
                          <Badge variant="outline">{feature.hours} Hours</Badge>
                        </div>
                      </div>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Third-party services and APIs</CardDescription>
            </CardHeader>
            <CardContent>
              {!project.roadmap?.integrations || project.roadmap.integrations.length === 0 ? (
                <p className="text-gray-500">No integrations defined yet.</p>
              ) : (
                <div className="space-y-4">
                  {project.roadmap.integrations.map((integration, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <h3 className="font-medium text-lg mb-2">{integration.name}</h3>
                      <p className="text-gray-600 mb-3">{integration.purpose}</p>
                      {integration.apiDocumentation && (
                        <a
                          href={integration.apiDocumentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          API Documentation
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Personas</CardTitle>
              <CardDescription>Target users and their needs</CardDescription>
            </CardHeader>
            <CardContent>
              {!project.personas || project.personas.length === 0 ? (
                <p className="text-gray-500">No personas defined yet.</p>
              ) : (
                <div className="space-y-6">
                  {project.personas.map((persona, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row justify-between md:items-center mb-3 gap-2">
                        <h3 className="font-medium text-lg">{persona.name}</h3>
                        <Badge variant="outline">{persona.role}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Goals</h4>
                          <p>{persona.goals}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Pain Points</h4>
                          <p>{persona.painPoints}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.technicalConstraints || "No technical constraints defined."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.businessConstraints || "No business constraints defined."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferred Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.preferredTechnologies || "No preferred technologies specified."}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sample data for demonstration
function getSampleProjectDetail(id: string): ArchitectureProjectDetail {
  return {
    id,
    name: "E-commerce Platform Redesign",
    status: "completed",
    createdAt: "2023-10-15T09:30:00Z",
    updatedAt: "2023-11-01T14:20:00Z",
    meetingDate: "2023-10-18T10:00:00Z",
    deliveryDate: "2023-10-25T15:00:00Z",
    totalPoints: 89,
    totalHours: 445,
    budget: 75000,
    roadmap: {
      mvp: {
        features: [
          {
            name: "User Authentication",
            description: "Allow users to sign up, log in, and manage their accounts",
            priority: "high",
            complexity: "m",
            points: 8,
            hours: 40,
          },
          {
            name: "Product Catalog",
            description: "Display products with filtering and sorting options",
            priority: "high",
            complexity: "l",
            points: 13,
            hours: 65,
          },
          {
            name: "Shopping Cart",
            description: "Add, remove, and update items in the cart",
            priority: "high",
            complexity: "m",
            points: 8,
            hours: 40,
          },
          {
            name: "Checkout Process",
            description: "Multi-step checkout with payment integration",
            priority: "high",
            complexity: "l",
            points: 13,
            hours: 65,
          },
          {
            name: "Order Management",
            description: "View and manage orders for customers and admins",
            priority: "medium",
            complexity: "m",
            points: 8,
            hours: 40,
          },
        ],
      },
      future: {
        features: [
          {
            name: "Wishlist",
            description: "Allow users to save products for later",
            priority: "low",
            complexity: "s",
            points: 5,
            hours: 25,
          },
          {
            name: "Product Reviews",
            description: "Allow customers to leave reviews and ratings",
            priority: "medium",
            complexity: "m",
            points: 8,
            hours: 40,
          },
          {
            name: "Personalized Recommendations",
            description: "Show product recommendations based on user behavior",
            priority: "low",
            complexity: "l",
            points: 13,
            hours: 65,
          },
        ],
      },
      integrations: [
        {
          name: "Stripe",
          purpose: "Payment processing for customer orders",
          apiDocumentation: "https://stripe.com/docs/api",
        },
        {
          name: "Mailchimp",
          purpose: "Email marketing and customer communications",
          apiDocumentation: "https://mailchimp.com/developer/",
        },
        {
          name: "Algolia",
          purpose: "Fast and relevant product search",
          apiDocumentation: "https://www.algolia.com/doc/api-reference/",
        },
      ],
    },
    personas: [
      {
        name: "Shopping Sarah",
        role: "Regular Customer",
        goals: "Find products quickly, get the best deals, and have a smooth checkout experience",
        painPoints: "Slow website, complicated checkout, hard to find products",
      },
      {
        name: "Manager Mike",
        role: "Store Admin",
        goals: "Efficiently manage inventory, process orders quickly, and access sales reports",
        painPoints: "Complex admin interface, manual order processing, limited reporting",
      },
    ],
    technicalConstraints: "Must support IE11, mobile responsive, and load times under 3 seconds",
    businessConstraints: "Must launch before holiday season (November), budget cap of $75,000",
    preferredTechnologies: "React, Node.js, PostgreSQL, AWS",
    realityCheck:
      "Your MVP scope slightly exceeds your budget by about 15%. Minor adjustments may be needed to stay within budget constraints.",
  }
}
