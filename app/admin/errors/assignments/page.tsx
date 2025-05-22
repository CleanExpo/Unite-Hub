import type { Metadata } from "next"
import ErrorAssignmentsTable from "@/components/admin/error-assignments-table"

export const metadata: Metadata = {
  title: "Error Assignments | Admin Dashboard",
  description: "Manage error assignments to team members",
}

export default function ErrorAssignmentsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Error Assignments</h1>
      <ErrorAssignmentsTable />
    </div>
  )
}
