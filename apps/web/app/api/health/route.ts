import { NextResponse } from "next/server";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  verification_system: {
    enabled: boolean;
    independent_verification: boolean;
    self_attestation_blocked: boolean;
  };
}

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const response: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || "development",
    verification_system: {
      enabled: true,
      independent_verification: true,
      self_attestation_blocked: true,
    },
  };

  return NextResponse.json(response);
}
