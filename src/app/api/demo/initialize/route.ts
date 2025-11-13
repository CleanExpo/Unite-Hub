import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

/**
 * DEMO INITIALIZATION API
 * Creates complete demo environment with organization, client, and sample data
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Parse request body (optional - could include custom demo params)
    let customParams = {};
    try {
      customParams = await request.json();
    } catch {
      // No body provided, use defaults
    }

    console.log("Starting demo initialization...");

    // Step 1: Create demo organization (idempotent)
    console.log("Creating demo organization...");
    const orgId = await convex.mutation(api.organizations.createDemoOrg, {});
    console.log("Demo organization created:", orgId);

    // Step 2: Create demo client "Duncan's Tea House" (idempotent)
    console.log("Creating demo client...");
    const clientId = await convex.mutation(api.clients.createDemoClient, {
      orgId,
    });
    console.log("Demo client created:", clientId);

    // Step 3: Create sample persona for tea business (idempotent)
    console.log("Creating demo persona...");
    const personaId = await convex.mutation(
      api.demo.seedData.seedPersona,
      { clientId }
    );
    console.log("Demo persona created:", personaId);

    // Step 4: Create sample marketing strategy (idempotent)
    console.log("Creating demo strategy...");
    const strategyId = await convex.mutation(
      api.demo.seedData.seedStrategy,
      { clientId, personaId }
    );
    console.log("Demo strategy created:", strategyId);

    // Step 5: Create sample calendar posts (idempotent)
    console.log("Creating demo calendar posts...");
    const postIds = await convex.mutation(
      api.demo.seedData.seedCalendarPosts,
      { clientId, strategyId }
    );
    console.log("Demo calendar posts created:", postIds.length);

    // Return success response with all IDs
    return NextResponse.json(
      {
        success: true,
        message: "Demo environment initialized successfully",
        data: {
          orgId,
          clientId,
          personaId,
          strategyId,
          postIds,
          postCount: Array.isArray(postIds) ? postIds.length : 0,
        },
        demo: {
          organizationName: "Demo Organization",
          clientName: "Duncan's Tea House",
          personaName: "Tea Enthusiast Emma",
          strategyTitle: "Premium Tea Education & Community Building Strategy",
          calendarPostsGenerated: Array.isArray(postIds) ? postIds.length : 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Demo initialization error:", error);

    // Return detailed error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize demo",
        message: error.message || "Unknown error occurred",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check demo status
export async function GET(request: NextRequest) {
  try {
    // Query for demo organization
    const demoOrg = await convex.query(api.organizations.getByEmail, {
      email: "demo@unite-hub.com",
    });

    if (!demoOrg) {
      return NextResponse.json({
        initialized: false,
        message: "Demo not initialized. Call POST to create demo environment.",
      });
    }

    // Get demo client
    const clients = await convex.query(api.clients.listByOrg, {
      orgId: demoOrg._id,
    });

    const demoClient = clients.find(
      (c: any) => c.businessName === "Duncan's Tea House"
    );

    if (!demoClient) {
      return NextResponse.json({
        initialized: false,
        hasOrg: true,
        message: "Demo organization exists but no client. Call POST to complete setup.",
      });
    }

    // Get demo data stats
    const personas = await convex.query(api.personas.listByClient, {
      clientId: demoClient._id,
    });

    const strategies = await convex.query(api.strategies.listByClient, {
      clientId: demoClient._id,
    });

    const calendarStats = await convex.query(
      api.contentCalendar.getCalendarStats,
      { clientId: demoClient._id }
    );

    return NextResponse.json({
      initialized: true,
      demo: {
        orgId: demoOrg._id,
        orgName: demoOrg.name,
        clientId: demoClient._id,
        clientName: demoClient.businessName,
        personasCount: personas.length,
        strategiesCount: strategies.length,
        calendarPostsCount: calendarStats.totalPosts,
      },
      message: "Demo environment is fully initialized",
    });
  } catch (error: any) {
    console.error("Demo status check error:", error);

    return NextResponse.json(
      {
        error: "Failed to check demo status",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clean up demo data (for testing)
export async function DELETE(request: NextRequest) {
  try {
    // This would implement cleanup logic
    // For production, you might want to restrict this endpoint

    return NextResponse.json({
      message: "Demo cleanup not implemented yet",
      note: "For safety, manual cleanup is recommended",
    });
  } catch (error: any) {
    console.error("Demo cleanup error:", error);

    return NextResponse.json(
      {
        error: "Failed to cleanup demo",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
