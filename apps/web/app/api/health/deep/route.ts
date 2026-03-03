import { NextResponse } from 'next/server';

interface DependencyCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unchecked';
  latency_ms: number | null;
  error: string | null;
  last_checked: string;
}

interface DeepHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  dependencies: {
    database: DependencyCheck;
    backend: DependencyCheck;
    verification_system: DependencyCheck;
  };
  verification_system: {
    enabled: boolean;
    independent_verification: boolean;
    self_attestation_blocked: boolean;
    verifier_available: boolean;
  };
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    degraded: number;
  };
}

const startTime = Date.now();
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  const result: DependencyCheck = {
    name: 'database',
    status: 'unchecked',
    latency_ms: null,
    error: null,
    last_checked: new Date().toISOString(),
  };

  try {
    // Check database health via the backend /ready endpoint
    const response = await fetch(`${BACKEND_URL}/ready`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    result.latency_ms = Date.now() - start;

    if (response.ok) {
      result.status = 'healthy';
    } else {
      result.status = 'degraded';
      result.error = `Backend ready check returned status ${response.status}`;
    }
  } catch (e) {
    result.latency_ms = Date.now() - start;
    result.status = 'unhealthy';
    result.error = e instanceof Error ? e.message : 'Database check failed';
  }

  return result;
}

async function checkBackend(): Promise<DependencyCheck> {
  const start = Date.now();
  const result: DependencyCheck = {
    name: 'backend',
    status: 'unchecked',
    latency_ms: null,
    error: null,
    last_checked: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    result.latency_ms = Date.now() - start;

    if (response.ok) {
      result.status = 'healthy';
    } else {
      result.status = 'degraded';
      result.error = `Backend returned status ${response.status}`;
    }
  } catch (e) {
    result.latency_ms = Date.now() - start;
    result.status = 'unhealthy';
    result.error = e instanceof Error ? e.message : 'Backend unreachable';
  }

  return result;
}

async function checkVerificationSystem(): Promise<DependencyCheck> {
  const start = Date.now();
  const result: DependencyCheck = {
    name: 'verification_system',
    status: 'healthy',
    latency_ms: 0,
    error: null,
    last_checked: new Date().toISOString(),
  };

  try {
    // Check that IndependentVerifier can be instantiated
    const { IndependentVerifier } = await import('@/lib/agents/independent-verifier');
    const verifier = new IndependentVerifier();
    const verifierId = verifier.getVerifierId();

    result.latency_ms = Date.now() - start;

    if (verifierId && verifierId.startsWith('verifier_')) {
      result.status = 'healthy';
    } else {
      result.status = 'degraded';
      result.error = 'Verifier ID format invalid';
    }
  } catch (e) {
    result.latency_ms = Date.now() - start;
    result.status = 'unhealthy';
    result.error = e instanceof Error ? e.message : 'Verification system error';
  }

  return result;
}

export async function GET(): Promise<NextResponse<DeepHealthResponse>> {
  const [database, backend, verification] = await Promise.all([
    checkDatabase(),
    checkBackend(),
    checkVerificationSystem(),
  ]);

  const dependencies = { database, backend, verification_system: verification };

  // Calculate summary
  const checks = Object.values(dependencies);
  const summary = {
    total_checks: checks.length,
    passed: checks.filter((c) => c.status === 'healthy').length,
    failed: checks.filter((c) => c.status === 'unhealthy').length,
    degraded: checks.filter((c) => c.status === 'degraded').length,
  };

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (summary.failed > 0) {
    overallStatus = 'unhealthy';
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded';
  }

  const response: DeepHealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    dependencies,
    verification_system: {
      enabled: true,
      independent_verification: true,
      self_attestation_blocked: true,
      verifier_available: verification.status === 'healthy',
    },
    summary,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  return NextResponse.json(response, { status: statusCode });
}
