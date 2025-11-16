import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id]/strategy/platforms - Get platform-specific strategies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get organization to check tier
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const organization = await db.organizations.getById(workspace.org_id);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = organization.plan || "starter";

    // Check tier access for multiple platforms
    if (plan === "starter" && platform && platform !== "facebook") {
      return NextResponse.json(
        {
          error:
            "Multiple platform strategies are only available in Professional plan",
        },
        { status: 403 }
      );
    }

    // Platform-specific strategies
    const platforms: Record<string, any> = {
      facebook: {
        platform: "Facebook",
        objectives: ["Brand awareness", "Community building", "Traffic"],
        content_types: [
          "Video posts",
          "Image carousels",
          "Stories",
          "Live videos",
        ],
        posting_frequency: "3-5 times per week",
        best_times: ["Monday-Friday 9am-11am", "Wednesday-Sunday 1pm-3pm"],
        ad_strategy: {
          budget: "$500-$2000/month",
          targeting: "Lookalike audiences, interest-based targeting",
          formats: ["Single image", "Video", "Carousel"],
        },
        engagement_tactics: [
          "Respond to comments within 1 hour",
          "Run weekly polls",
          "Share user-generated content",
        ],
        metrics_to_track: [
          "Reach",
          "Engagement rate",
          "Page likes",
          "Link clicks",
        ],
      },
      instagram: {
        platform: "Instagram",
        objectives: ["Visual storytelling", "Engagement", "Brand personality"],
        content_types: [
          "Feed posts",
          "Reels",
          "Stories",
          "IGTV",
          "Carousel posts",
        ],
        posting_frequency: "1-2 posts/day + 5-10 stories/day",
        best_times: ["Monday-Friday 10am-3pm", "Wednesday 11am"],
        ad_strategy: {
          budget: "$500-$2000/month",
          targeting: "Demographic, interest, behavior",
          formats: ["Stories ads", "Reels ads", "Explore ads"],
        },
        engagement_tactics: [
          "Use 20-30 relevant hashtags",
          "Engage with followers' content",
          "Run contests and giveaways",
        ],
        metrics_to_track: [
          "Followers growth",
          "Engagement rate",
          "Story views",
          "Profile visits",
        ],
      },
      tiktok: {
        platform: "TikTok",
        objectives: ["Viral content", "Brand discovery", "Young audience"],
        content_types: [
          "Short-form videos",
          "Trends participation",
          "Educational content",
        ],
        posting_frequency: "1-3 times per day",
        best_times: ["Tuesday-Thursday 6pm-10pm", "Friday 5am-9am"],
        ad_strategy: {
          budget: "$500-$1500/month",
          targeting: "Age, interests, behaviors",
          formats: ["In-feed ads", "TopView", "Branded effects"],
        },
        engagement_tactics: [
          "Participate in trending challenges",
          "Use trending sounds",
          "Collaborate with creators",
        ],
        metrics_to_track: [
          "Views",
          "Completion rate",
          "Shares",
          "Follower growth",
        ],
      },
      linkedin: {
        platform: "LinkedIn",
        objectives: [
          "Thought leadership",
          "B2B networking",
          "Lead generation",
        ],
        content_types: [
          "Articles",
          "Professional updates",
          "Industry insights",
          "Case studies",
        ],
        posting_frequency: "3-5 times per week",
        best_times: ["Tuesday-Thursday 8am-10am", "Wednesday 12pm"],
        ad_strategy: {
          budget: "$1000-$3000/month",
          targeting: "Job title, industry, company size",
          formats: ["Sponsored content", "InMail", "Text ads"],
        },
        engagement_tactics: [
          "Comment on industry posts",
          "Share valuable insights",
          "Engage in groups",
        ],
        metrics_to_track: [
          "Impressions",
          "Engagement rate",
          "Click-through rate",
          "Lead generation",
        ],
      },
    };

    // Filter by platform if specified
    if (platform) {
      const platformStrategy = platforms[platform.toLowerCase()];
      if (!platformStrategy) {
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 }
        );
      }
      return NextResponse.json({ strategy: platformStrategy });
    }

    // Return available platforms based on tier
    const availablePlatforms =
      plan === "professional"
        ? platforms
        : { facebook: platforms.facebook };

    return NextResponse.json({
      strategies: availablePlatforms,
      available_count: Object.keys(availablePlatforms).length,
    });
  } catch (error) {
    console.error("Error fetching platform strategies:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform strategies" },
      { status: 500 }
    );
  }
}
