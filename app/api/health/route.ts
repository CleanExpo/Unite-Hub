import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use Vercel's built-in environment variables
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      // Vercel automatically provides these deployment details
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || "local",
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || "local",
      region: process.env.VERCEL_REGION || "local",
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || "main",
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        "x-build-id": healthData.buildId,
        "x-deployment-id": healthData.deploymentId,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "x-build-id": process.env.VERCEL_GIT_COMMIT_SHA || "local",
      "x-deployment-id": process.env.VERCEL_DEPLOYMENT_ID || "local",
    },
  })
}
