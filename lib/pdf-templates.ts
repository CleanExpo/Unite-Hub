import { createStyledPDFWithBranding } from "./pdf-styling"

// Create a project report PDF
export async function createProjectReportPDF(project: any, tasks: any[], members: any[]) {
  const doc = await createStyledPDFWithBranding({
    headerText: "Project Report",
  })

  // Add project details
  doc.addHeading(project.name, 1)

  if (project.description) {
    doc.addParagraph(project.description)
  }

  doc.addSpacer()

  // Add project metadata
  doc.addHeading("Project Details", 2)

  const metadata = [
    { label: "Status", value: project.status },
    { label: "Start Date", value: new Date(project.start_date).toLocaleDateString() },
    { label: "Due Date", value: project.due_date ? new Date(project.due_date).toLocaleDateString() : "Not set" },
    { label: "Created", value: new Date(project.created_at).toLocaleDateString() },
  ]

  metadata.forEach((item) => {
    doc.addParagraph(`${item.label}: ${item.value}`, {
      fontSize: 10,
      style: item.label === "Status" ? "bold" : "normal",
    })
  })

  doc.addSpacer()

  // Add task summary
  if (tasks.length > 0) {
    doc.addHeading("Tasks", 2)

    // Group tasks by status
    const tasksByStatus: Record<string, any[]> = {}
    tasks.forEach((task) => {
      if (!tasksByStatus[task.status]) {
        tasksByStatus[task.status] = []
      }
      tasksByStatus[task.status].push(task)
    })

    // Add task summary table
    const taskSummary = Object.entries(tasksByStatus).map(([status, tasks]) => ({
      status,
      count: tasks.length,
      percentage: Math.round((tasks.length / tasks.length) * 100),
    }))

    doc.addTable(taskSummary, ["status", "count", "percentage"], {
      headerColor: doc.colorScheme.primary,
    })

    doc.addSpacer()

    // Add task list
    doc.addHeading("Task List", 3)

    const taskTableData = tasks.map((task) => ({
      name: task.title,
      status: task.status,
      assignee: task.assignee_name || "Unassigned",
      due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set",
    }))

    doc.addTable(taskTableData, ["name", "status", "assignee", "due"], {
      headerColor: doc.colorScheme.primary,
    })
  }

  doc.addSpacer()

  // Add team members
  if (members.length > 0) {
    doc.addHeading("Team Members", 2)

    const memberTableData = members.map((member) => ({
      name: member.name || member.email,
      role: member.role,
      joined: new Date(member.joined_at).toLocaleDateString(),
    }))

    doc.addTable(memberTableData, ["name", "role", "joined"], {
      headerColor: doc.colorScheme.primary,
    })
  }

  return doc
}

// Create a task report PDF
export async function createTaskReportPDF(task: any, comments: any[]) {
  const doc = await createStyledPDFWithBranding({
    headerText: "Task Report",
  })

  // Add task details
  doc.addHeading(task.title, 1)

  if (task.description) {
    doc.addParagraph(task.description)
  }

  doc.addSpacer()

  // Add task metadata
  doc.addHeading("Task Details", 2)

  const metadata = [
    { label: "Status", value: task.status },
    { label: "Priority", value: task.priority || "Not set" },
    { label: "Assignee", value: task.assignee_name || "Unassigned" },
    { label: "Due Date", value: task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set" },
    { label: "Created", value: new Date(task.created_at).toLocaleDateString() },
  ]

  metadata.forEach((item) => {
    doc.addParagraph(`${item.label}: ${item.value}`, {
      fontSize: 10,
      style: item.label === "Status" || item.label === "Priority" ? "bold" : "normal",
    })
  })

  doc.addSpacer()

  // Add comments
  if (comments.length > 0) {
    doc.addHeading("Comments", 2)

    comments.forEach((comment) => {
      doc.addParagraph(comment.author_name || "User", {
        fontSize: 10,
        style: "bold",
        color: doc.colorScheme.primary,
      })

      doc.addParagraph(comment.content)

      doc.addParagraph(new Date(comment.created_at).toLocaleString(), {
        fontSize: 8,
        color: doc.colorScheme.secondary,
      })

      doc.addHorizontalLine({ width: 0.2 })
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
  doc.addHeading(`${user.name || "User"} Profile`, 1)

  if (user.bio) {
    doc.addParagraph(user.bio)
  }

  doc.addSpacer()

  // Add user metadata
  doc.addHeading("User Details", 2)

  const metadata = [
    { label: "Email", value: user.email },
    { label: "Role", value: user.role || "Member" },
    { label: "Joined", value: new Date(user.created_at).toLocaleDateString() },
  ]

  metadata.forEach((item) => {
    doc.addParagraph(`${item.label}: ${item.value}`, { fontSize: 10 })
  })

  doc.addSpacer()

  // Add projects
  if (projects.length > 0) {
    doc.addHeading("Projects", 2)

    const projectTableData = projects.map((project) => ({
      name: project.name,
      role: project.user_role || "Member",
      status: project.status,
      tasks: project.task_count || 0,
    }))

    doc.addTable(projectTableData, ["name", "role", "status", "tasks"], {
      headerColor: doc.colorScheme.primary,
    })
  }

  doc.addSpacer()

  // Add tasks
  if (tasks.length > 0) {
    doc.addHeading("Recent Tasks", 2)

    const taskTableData = tasks.map((task) => ({
      name: task.title,
      project: task.project_name,
      status: task.status,
      due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set",
    }))

    doc.addTable(taskTableData, ["name", "project", "status", "due"], {
      headerColor: doc.colorScheme.primary,
    })
  }

  return doc
}
