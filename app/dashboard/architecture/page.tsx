"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Calendar, Clock, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

interface ArchitectureProject {
  id: string
  name: string
  status: "draft" | "paid" | "in_progress" | "completed"
  createdAt: string
  updatedAt: string
  meetingDate?: string
  totalPoints?: number
  totalHours?: number
  budget?: number
}

export default function ArchitectureDashboard() {
  const [projects, setProjects] = useState<ArchitectureProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/architecture/projects")
        if (!response.ok) {
          throw new Error("Failed to fetch projects")
        }
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Loading your projects...</p>
        </div>
      </div>
    )
  }

  // For demo purposes, if there's an error or no projects, show sample data
  const displayProjects = error || projects.length === 0 ? getSampleProjects() : projects

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Architecture Projects</h1>
          <p className="text-gray-500">Manage and track your architecture blueprints</p>
        </div>
        <Button asChild>
          <Link href="/architecture">
            <Plus className="mr-2 h-4 w-4" />
            New Blueprint
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          Error: {error}. Showing sample data instead.
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {displayProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {displayProjects
            .filter((p) => p.status === "paid" || p.status === "in_progress")
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {displayProjects
            .filter((p) => p.status === "completed")
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-6">
          {displayProjects
            .filter((p) => p.status === "draft")
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProjectCard({ project }: { project: ArchitectureProject }) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>Project ID: {project.id}</CardDescription>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status === "in_progress"
              ? "In Progress"
              : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {project.totalPoints ? `${project.totalPoints} Story Points` : "Points pending"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{project.totalHours ? `${project.totalHours} Est. Hours` : "Hours pending"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Created {formatDate(project.createdAt)}</span>
          </div>
        </div>

        {project.meetingDate && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Consultation:</span> {formatDate(project.meetingDate)}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href={`/dashboard/architecture/${project.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Sample data for demonstration
function getSampleProjects(): ArchitectureProject[] {
  return [
    {
      id: "ARCH-1a2b3c",
      name: "E-commerce Platform Redesign",
      status: "completed",
      createdAt: "2023-10-15T09:30:00Z",
      updatedAt: "2023-11-01T14:20:00Z",
      meetingDate: "2023-10-18T10:00:00Z",
      totalPoints: 89,
      totalHours: 445,
      budget: 75000,
    },
    {
      id: "ARCH-4d5e6f",
      name: "Mobile App MVP",
      status: "in_progress",
      createdAt: "2023-11-05T11:45:00Z",
      updatedAt: "2023-11-10T16:30:00Z",
      meetingDate: "2023-11-08T14:00:00Z",
      totalPoints: 42,
      totalHours: 210,
      budget: 35000,
    },
    {
      id: "ARCH-7g8h9i",
      name: "Internal Dashboard",
      status: "paid",
      createdAt: "2023-11-12T08:15:00Z",
      updatedAt: "2023-11-12T08:15:00Z",
      meetingDate: "2023-11-15T10:00:00Z",
    },
    {
      id: "ARCH-0j1k2l",
      name: "Customer Portal",
      status: "draft",
      createdAt: "2023-11-14T15:20:00Z",
      updatedAt: "2023-11-14T15:20:00Z",
    },
  ]
}
