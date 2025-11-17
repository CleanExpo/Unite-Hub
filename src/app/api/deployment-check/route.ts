import { NextResponse } from 'next/server';
import { runDeploymentChecks } from '@/lib/deployment-check';

/**
 * Deployment Readiness Check Endpoint
 * Validates production configuration
 */
export async function GET() {
  const report = await runDeploymentChecks();

  const status = report.ready ? 200 : 503;

  return NextResponse.json(report, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
