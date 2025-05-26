import { createStyledPDFWithBranding } from "./pdf-styling"

// Create a project report PDF
export async function createProjectReportPDF(project: any, tasks: any[], members: any[]) {
  const doc = await createStyledPDFWithBranding({
    headerText: "Project Report",
  })

  // Add project details
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(project.name, 20, 30)

  if (project.description) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(project.description, 20, 45)
  }

  // Add project metadata
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Project Details", 20, 70)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Status: ${project.status}`, 20, 85)
  doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString()}`, 20, 95)
  doc.text(`Due Date: ${project.due_date ? new Date(project.due_date).toLocaleDateString() : "Not set"}`, 20, 105)
  doc.text(`Created: ${new Date(project.created_at).toLocaleDateString()}`, 20, 115)

  return doc
}

// Create a task report PDF
export async function createTaskReportPDF(task: any, comments: any[]) {
  const doc = await createStyledPDFWithBranding({
    headerText: "Task Report",
  })

  // Add task details
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(task.title, 20, 30)

  if (task.description) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(task.description, 20, 45)
  }

  // Add task metadata
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Task Details", 20, 70)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Status: ${task.status}`, 20, 85)
  doc.text(`Priority: ${task.priority || "Not set"}`, 20, 95)
  doc.text(`Assignee: ${task.assignee_name || "Unassigned"}`, 20, 105)
  doc.text(`Due Date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set"}`, 20, 115)
  doc.text(`Created: ${new Date(task.created_at).toLocaleDateString()}`, 20, 125)

  return doc
}

// Create a user report PDF
export async function createUserReportPDF(user: any, projects: any[], tasks: any[]) {
  const doc = await createStyledPDFWithBranding({
    headerText: "User Report",
  })

  // Add user details
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(`${user.name || "User"} Profile`, 20, 30)

  if (user.bio) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(user.bio, 20, 45)
  }

  // Add user metadata
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("User Details", 20, 70)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Email: ${user.email}`, 20, 85)
  doc.text(`Role: ${user.role || "Member"}`, 20, 95)
  doc.text(`Joined: ${new Date(user.created_at).toLocaleDateString()}`, 20, 105)

  return doc
}
