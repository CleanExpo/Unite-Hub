export async function getStaffTasks() {
  const res = await fetch('/api/staff/tasks', { cache: 'no-store' })
  return res.json()
}

export async function updateTaskStatus(id: string, status: string) {
  const res = await fetch('/api/staff/tasks/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  })
  return res.json()
}

export async function getStaffProjects() {
  const res = await fetch('/api/staff/projects', { cache: 'no-store' })
  return res.json()
}

export async function getStaffActivity() {
  const res = await fetch('/api/staff/activity', { cache: 'no-store' })
  return res.json()
}

export async function getAIDailyBriefing() {
  const res = await fetch('/api/ai/overnight-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  return res.json()
}
