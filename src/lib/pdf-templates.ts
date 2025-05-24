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

  // Add task summary if tasks exist
  if (tasks.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Tasks Summary", 20, 140)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Tasks: ${tasks.length}`, 20, 155)

    const completedTasks = tasks.filter(task => task.status === 'completed').length
    doc.text(`Completed: ${completedTasks}`, 20, 165)
    doc.text(`Remaining: ${tasks.length - completedTasks}`, 20, 175)
  }

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

  // Add comments if they exist
  if (comments.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Comments", 20, 150)

    let yPosition = 165
    comments.slice(0, 3).forEach((comment, index) => {
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(`${comment.author_name || "User"}:`, 20, yPosition)
      
      doc.setFont("helvetica", "normal")
      doc.text(comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""), 20, yPosition + 10)
      
      yPosition += 25
    })
  }

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

  // Add project summary
  if (projects.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Projects", 20, 130)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Projects: ${projects.length}`, 20, 145)

    let yPosition = 160
    projects.slice(0, 5).forEach((project, index) => {
      doc.text(`• ${project.name} (${project.status})`, 25, yPosition)
      yPosition += 10
    })
  }

  // Add task summary
  if (tasks.length > 0) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Recent Tasks", 20, 220)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Tasks: ${tasks.length}`, 20, 235)

    let yPosition = 250
    tasks.slice(0, 5).forEach((task, index) => {
      doc.text(`• ${task.title} (${task.status})`, 25, yPosition)
      yPosition += 10
    })
  }

  return doc
}
