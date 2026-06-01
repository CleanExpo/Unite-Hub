import type {
  FounderDevice,
  FounderDeviceCapability,
  FounderDeviceRole,
  FounderRiskLevel,
  FounderTaskPacket,
  FounderTaskType,
  MachineAssignment,
} from './types'

const RISK_ORDER: FounderRiskLevel[] = ['low', 'medium', 'high', 'human_only']

const TASK_CAPABILITY_REQUIREMENTS: Record<FounderTaskType, FounderDeviceCapability[]> = {
  idea_capture: ['idea_capture'],
  approval: ['approval_review'],
  scheduled_brief: ['cron', 'scheduled_briefs', 'queue_worker'],
  webhook_processing: ['webhooks', 'queue_worker'],
  heavy_build: ['heavy_builds', 'local_verification'],
  browser_task: ['browser_automation', 'playwright'],
  research: ['queue_worker'],
  code_change: ['queue_worker', 'local_verification'],
  ui_review: ['mobile_review'],
  credential_grant: ['approval_review'],
  model_routing: ['context_sync'],
}

const FALLBACK_ROLES_BY_TASK: Record<FounderTaskType, FounderDeviceRole[]> = {
  idea_capture: ['mobile_cockpit', 'always_on_host'],
  approval: ['mobile_cockpit', 'always_on_host'],
  scheduled_brief: ['always_on_host', 'cloud_worker'],
  webhook_processing: ['always_on_host', 'cloud_worker'],
  heavy_build: ['heavy_worker', 'always_on_host'],
  browser_task: ['heavy_worker', 'always_on_host'],
  research: ['always_on_host', 'cloud_worker'],
  code_change: ['heavy_worker', 'always_on_host', 'cloud_worker'],
  ui_review: ['mobile_cockpit', 'heavy_worker'],
  credential_grant: ['mobile_cockpit'],
  model_routing: ['always_on_host', 'cloud_worker'],
}

export function requiredCapabilitiesForTask(task: FounderTaskPacket): FounderDeviceCapability[] {
  const required = new Set<FounderDeviceCapability>(TASK_CAPABILITY_REQUIREMENTS[task.taskType])

  if (task.requiresLongRunningHost) {
    required.add('queue_worker')
    required.add('context_sync')
  }

  if (task.requiresLocalExecution) {
    required.add('local_verification')
  }

  if (task.requiresBrowser) {
    required.add('browser_automation')
    required.add('playwright')
  }

  for (const capability of task.preferredCapabilities ?? []) {
    required.add(capability)
  }

  return Array.from(required)
}

export function assignMachineForTask(task: FounderTaskPacket, devices: FounderDevice[]): MachineAssignment {
  const fallbackRoles = FALLBACK_ROLES_BY_TASK[task.taskType]
  const requiredCapabilities = requiredCapabilitiesForTask(task)

  if (task.riskLevel === 'human_only' || task.requiresHumanApproval) {
    const approvalDevice = bestDeviceFor(task, devices, ['approval_review'], ['mobile_cockpit', 'always_on_host'])
    return {
      taskId: task.id,
      assignedDeviceId: approvalDevice?.id ?? null,
      assignedDeviceName: approvalDevice?.displayName ?? null,
      assignedRole: approvalDevice?.role ?? null,
      status: approvalDevice ? 'assigned' : 'requires_human_only',
      reasons: [
        'The task requires human approval before execution.',
        approvalDevice
          ? `${approvalDevice.displayName} is available for founder review.`
          : 'No approval-capable device is currently online.',
      ],
      fallbackRoles,
    }
  }

  const device = bestDeviceFor(task, devices, requiredCapabilities, fallbackRoles)

  if (!device) {
    return {
      taskId: task.id,
      assignedDeviceId: null,
      assignedDeviceName: null,
      assignedRole: null,
      status: 'waiting_for_device',
      reasons: [
        `No online device has the required capabilities: ${requiredCapabilities.join(', ')}.`,
        `Preferred roles: ${fallbackRoles.join(', ')}.`,
      ],
      fallbackRoles,
    }
  }

  return {
    taskId: task.id,
    assignedDeviceId: device.id,
    assignedDeviceName: device.displayName,
    assignedRole: device.role,
    status: 'assigned',
    reasons: buildAssignmentReasons(task, device, requiredCapabilities),
    fallbackRoles,
  }
}

function bestDeviceFor(
  task: FounderTaskPacket,
  devices: FounderDevice[],
  requiredCapabilities: FounderDeviceCapability[],
  preferredRoles: FounderDeviceRole[],
): FounderDevice | null {
  const candidates = devices
    .filter((device) => isAvailable(device))
    .filter((device) => riskAllowed(task.riskLevel, device.maxRiskLevel))
    .filter((device) => requiredCapabilities.every((capability) => device.capabilities.includes(capability)))
    .sort((a, b) => scoreDevice(b, preferredRoles) - scoreDevice(a, preferredRoles))

  return candidates[0] ?? null
}

function isAvailable(device: FounderDevice): boolean {
  return device.status === 'online' || device.status === 'idle'
}

function riskAllowed(taskRisk: FounderRiskLevel, maxRisk: FounderRiskLevel): boolean {
  return RISK_ORDER.indexOf(taskRisk) <= RISK_ORDER.indexOf(maxRisk)
}

function scoreDevice(device: FounderDevice, preferredRoles: FounderDeviceRole[]): number {
  const roleScore = preferredRoles.includes(device.role) ? 100 - preferredRoles.indexOf(device.role) * 10 : 0
  const loadScore = 20 - Math.min(device.currentLoad ?? 0, 20)
  const onlineScore = device.status === 'idle' ? 5 : 0
  return roleScore + loadScore + onlineScore
}

function buildAssignmentReasons(
  task: FounderTaskPacket,
  device: FounderDevice,
  requiredCapabilities: FounderDeviceCapability[],
): string[] {
  const reasons = [`${device.displayName} is assigned as ${device.role}.`]

  if (task.taskType === 'scheduled_brief' || task.requiresLongRunningHost) {
    reasons.push('Long-running/background work prefers the always-on host instead of a laptop.')
  }

  if (task.taskType === 'heavy_build') {
    reasons.push('Heavy build/test work prefers the desktop execution workstation.')
  }

  if (task.taskType === 'browser_task') {
    reasons.push('Browser/computer-use work requires Playwright/browser automation capability and approval-safe receipts.')
  }

  reasons.push(`Matched capabilities: ${requiredCapabilities.join(', ')}.`)
  return reasons
}
