/**
 * GET  /api/guardian/admin/qa/schedules — List QA schedules
 * POST /api/guardian/admin/qa/schedules — Create QA schedule
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  listQaSchedules,
  createQaSchedule,
} from '@/lib/guardian/simulation/qaScheduleExecutor';

/**
 * GET: List QA schedules for workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const isActive = req.nextUrl.searchParams.get('isActive');
  const limit = req.nextUrl.searchParams.get('limit');
  const offset = req.nextUrl.searchParams.get('offset');

  try {
    const schedules = await listQaSchedules(workspaceId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(schedules);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list QA schedules';
    return errorResponse(message, 500);
  }
});

/**
 * POST: Create new QA schedule
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  // Validate required fields
  const { name, schedule_cron, pack_id } = body;
  if (!name || !schedule_cron || !pack_id) {
    return errorResponse('name, schedule_cron, pack_id required', 400);
  }

  // Validate cron format (basic check)
  if (!isValidCron(schedule_cron)) {
    return errorResponse('Invalid cron expression format', 400);
  }

  try {
    const newSchedule = await createQaSchedule(workspaceId, {
      name,
      description: body.description,
      schedule_cron,
      timezone: body.timezone || 'UTC',
      pack_id,
      chaos_profile_id: body.chaos_profile_id,
      simulate_playbooks: body.simulate_playbooks || false,
      max_runtime_minutes: body.max_runtime_minutes || 30,
      createdBy: body.createdBy,
    });

    return successResponse(newSchedule, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create QA schedule';
    return errorResponse(message, 500);
  }
});

/**
 * Validate cron expression format
 */
function isValidCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check if all parts are either * or valid numbers/ranges
  return (
    isValidCronPart(minute, 0, 59) &&
    isValidCronPart(hour, 0, 23) &&
    isValidCronPart(dayOfMonth, 1, 31) &&
    isValidCronPart(month, 1, 12) &&
    isValidCronPart(dayOfWeek, 0, 7)
  );
}

/**
 * Check if a single cron part is valid
 */
function isValidCronPart(part: string, min: number, max: number): boolean {
  if (part === '*') {
    return true;
  }
  if (part.startsWith('*/')) {
    const step = parseInt(part.substring(2), 10);
    return !isNaN(step) && step > 0;
  }
  if (part.includes('-')) {
    const [start, end] = part.split('-').map((x) => parseInt(x, 10));
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
  }
  if (part.includes(',')) {
    return part.split(',').every((x) => {
      const num = parseInt(x, 10);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  const num = parseInt(part, 10);
  return !isNaN(num) && num >= min && num <= max;
}
