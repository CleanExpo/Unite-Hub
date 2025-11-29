import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { withRole } from "@/core/auth/middleware";

/**
 * GET /api/test/db
 * Test database connection - ADMIN ONLY
 * This endpoint exposes database info and should be restricted
 */
export const GET = withRole(['ADMIN', 'FOUNDER'], async (context, req) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Test database connection by fetching organizations
    // Only show count for security, not full data
    const { data } = await db.organizations.listAll();

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      organizationCount: data?.length || 0,
      authenticatedAs: context.user.email,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});
