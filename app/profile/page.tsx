import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileTabs from "./profile-tabs"

export default async function ProfilePage() {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError)
    // If profile doesn't exist, we'll create a default one in the UI
  }

  // Get user's projects count
  const { count: projectsCount, error: projectsError } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)

  // Get user's tasks count
  const { count: tasksCreatedCount, error: tasksCreatedError } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id)

  // Get user's assigned tasks count
  const { count: tasksAssignedCount, error: tasksAssignedError } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={`${profile.first_name || "User"}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-gray-400">
                      {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user.email}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Role: {profile?.role || "Member"} • Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Projects</p>
                <p className="text-2xl font-bold">{projectsCount || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Tasks Created</p>
                <p className="text-2xl font-bold">{tasksCreatedCount || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Tasks Assigned</p>
                <p className="text-2xl font-bold">{tasksAssignedCount || 0}</p>
              </div>
            </div>
          </div>

          <ProfileTabs user={user} profile={profile} />
        </div>
      </div>
    </div>
  )
}
