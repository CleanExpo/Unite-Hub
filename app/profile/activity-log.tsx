"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarClock, FileEdit, FolderPlus, ListChecks, MessageSquare, Plus } from "lucide-react"

type Activity = {
  id: string
  type: string
  entity_type: string
  entity_id: string
  entity_name: string
  created_at: string
  project_name?: string
  task_name?: string
}

export default function ActivityLog({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)

      try {
        // This is a mock implementation since we don't have an actual activity table
        // In a real app, you would fetch from an activities table

        // Get user's projects
        const { data: projects } = await supabaseClient
          .from("projects")
          .select("id, name, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        // Get user's tasks
        const { data: tasks } = await supabaseClient
          .from("tasks")
          .select("id, title, project_id, created_at")
          .eq("created_by", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        // Get project names for tasks
        const projectIds = tasks?.map((task) => task.project_id) || []
        const { data: taskProjects } = await supabaseClient.from("projects").select("id, name").in("id", projectIds)

        const projectMap =
          taskProjects?.reduce(
            (acc, project) => {
              acc[project.id] = project.name
              return acc
            },
            {} as Record<string, string>,
          ) || {}

        // Create mock activities
        const mockActivities: Activity[] = [
          ...(projects?.map((project) => ({
            id: `project-${project.id}`,
            type: "created",
            entity_type: "project",
            entity_id: project.id,
            entity_name: project.name,
            created_at: project.created_at,
          })) || []),

          ...(tasks?.map((task) => ({
            id: `task-${task.id}`,
            type: "created",
            entity_type: "task",
            entity_id: task.id,
            entity_name: task.title,
            created_at: task.created_at,
            project_name: projectMap[task.project_id],
          })) || []),
        ]

        // Sort by created_at
        mockActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setActivities(mockActivities)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [userId])

  const getActivityIcon = (activity: Activity) => {
    switch (activity.entity_type) {
      case "project":
        return activity.type === "created" ? (
          <FolderPlus className="h-5 w-5 text-blue-500" />
        ) : (
          <FileEdit className="h-5 w-5 text-orange-500" />
        )
      case "task":
        return activity.type === "created" ? (
          <ListChecks className="h-5 w-5 text-green-500" />
        ) : (
          <MessageSquare className="h-5 w-5 text-purple-500" />
        )
      default:
        return <Plus className="h-5 w-5 text-gray-500" />
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.entity_type) {
      case "project":
        return activity.type === "created"
          ? `Created project "${activity.entity_name}"`
          : `Updated project "${activity.entity_name}"`
      case "task":
        return activity.type === "created"
          ? `Created task "${activity.entity_name}" in project "${activity.project_name}"`
          : `Updated task "${activity.entity_name}"`
      default:
        return `Activity on ${activity.entity_type} "${activity.entity_name}"`
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarClock className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No activity yet</h3>
        <p className="text-gray-500">Your recent activities will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <div className="mt-1 bg-gray-100 rounded-full p-2">{getActivityIcon(activity)}</div>
          <div>
            <p className="font-medium">{getActivityText(activity)}</p>
            <p className="text-sm text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
