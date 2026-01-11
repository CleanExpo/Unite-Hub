/**
 * Social Media Mockup Generator
 * Generates platform-realistic mockups for Instagram, LinkedIn, TikTok, etc.
 * Uses Gemini 3 Pro to create composite mockup images with platform UI overlays
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export type SocialPlatform =
  | "instagram-feed"
  | "instagram-story"
  | "facebook-post"
  | "linkedin-post"
  | "twitter-post"
  | "tiktok"
  | "pinterest-pin";

export interface SocialMockupRequest {
  platform: SocialPlatform;
  contentImage?: string; // Base64 or URL to image
  caption: string; // Post caption/text
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    reposts?: number;
    saves?: number;
  };
  authorProfile?: {
    name: string;
    handle: string;
    avatar?: string; // Base64 or URL
    isVerified?: boolean;
    followerCount?: string; // "1.2M"
  };
  hashtags?: string[]; // ["#plumbing", "#diy"]
  timestamp?: string; // "2 hours ago"
}

export interface SocialMockupResult {
  imageUrl: string; // Base64 encoded mockup image
  platform: SocialPlatform;
  dimensions: {
    width: number;
    height: number;
  };
  generatedAt: string;
}

let geminiClient: GoogleGenerativeAI | null = null;
let geminiClientTimestamp = 0;
const GEMINI_CLIENT_TTL = 60000;

function getGeminiClient(): GoogleGenerativeAI {
  const now = Date.now();
  if (
    !geminiClient ||
    now - geminiClientTimestamp > GEMINI_CLIENT_TTL
  ) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY env var not set");
    }
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    geminiClientTimestamp = now;
  }
  return geminiClient;
}

/**
 * Generate a social media mockup image
 */
export async function generateSocialMockup(
  request: SocialMockupRequest
): Promise<SocialMockupResult> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: "gemini-3-pro" });

  const prompt = buildMockupPrompt(request);
  const dimensions = getPlatformDimensions(request.platform);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  // Note: Gemini 3 Pro image generation may require different approach
  // This is a placeholder for the actual implementation
  const imageContent = result.response;

  return {
    imageUrl: "", // Would be populated from actual image generation
    platform: request.platform,
    dimensions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate multiple platform mockups for a single piece of content
 */
export async function generateMultiPlatformMockups(
  request: Omit<SocialMockupRequest, "platform">,
  platforms: SocialPlatform[]
): Promise<SocialMockupResult[]> {
  return Promise.all(
    platforms.map((platform) =>
      generateSocialMockup({ ...request, platform })
    )
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildMockupPrompt(request: SocialMockupRequest): string {
  const dimensions = getPlatformDimensions(request.platform);
  const platformSpecs = getPlatformSpecs(request.platform);

  let prompt = `Generate a realistic ${request.platform} mockup image with these specifications:

DIMENSIONS: ${dimensions.width}x${dimensions.height}px
PLATFORM: ${request.platform}

PLATFORM-SPECIFIC UI:
${platformSpecs.uiDescription}

CONTENT:
- Caption/Text: ${request.caption}
- Main Image: [User-provided image placeholder]
${request.hashtags ? `- Hashtags: ${request.hashtags.join(" ")}` : ""}

AUTHOR PROFILE:
${
  request.authorProfile
    ? `
- Name: ${request.authorProfile.name}
- Handle: ${request.authorProfile.handle}
- Avatar: [Profile picture]
${request.authorProfile.isVerified ? "- Show verified checkmark ✓" : ""}
- Followers: ${request.authorProfile.followerCount || "Not shown"}
`
    : "- Generic/placeholder profile"
}

ENGAGEMENT METRICS:
${
  request.engagement
    ? `
- Likes: ${request.engagement.likes}
- Comments: ${request.engagement.comments}
- Shares: ${request.engagement.shares}
${request.engagement.reposts ? `- Reposts: ${request.engagement.reposts}` : ""}
${request.engagement.saves ? `- Saves: ${request.engagement.saves}` : ""}
`
    : "- Show typical engagement numbers for this platform"
}

TIMESTAMP: ${request.timestamp || "2 hours ago"}

REQUIREMENTS:
1. Use exact platform colors, fonts, and UI elements
2. Make it look like a real screenshot, not a mockup
3. Include all platform-specific UI elements (buttons, icons, badges)
4. Use realistic engagement numbers if not provided
5. High quality, professional appearance
6. ${platformSpecs.additionalRequirements}

Generate the mockup image.`;

  return prompt;
}

function getPlatformDimensions(
  platform: SocialPlatform
): { width: number; height: number } {
  const dimensions: Record<SocialPlatform, { width: number; height: number }> =
    {
      "instagram-feed": { width: 1080, height: 1080 },
      "instagram-story": { width: 1080, height: 1920 },
      "facebook-post": { width: 1200, height: 630 },
      "linkedin-post": { width: 1200, height: 627 },
      "twitter-post": { width: 1200, height: 675 },
      tiktok: { width: 1080, height: 1920 },
      "pinterest-pin": { width: 1000, height: 1500 },
    };

  return dimensions[platform];
}

interface PlatformSpecs {
  uiDescription: string;
  additionalRequirements: string;
}

function getPlatformSpecs(platform: SocialPlatform): PlatformSpecs {
  const specs: Record<SocialPlatform, PlatformSpecs> = {
    "instagram-feed": {
      uiDescription: `
- Profile picture in top left
- Username and timestamp in header
- Main image/content in center
- Like, comment, share, save buttons below image
- Like count and comment section
- Caption with author name and full text`,
      additionalRequirements:
        "Match Instagram's current design (2026). Include heart icon, comment bubble, share icon, bookmark icon.",
    },
    "instagram-story": {
      uiDescription: `
- Top bar with time and status icons
- Main content image full-width
- Bottom bar with username and profile picture
- Action buttons (reply, share, forward)
- Gradient overlay effects if needed`,
      additionalRequirements:
        "Make it look like a screenshot from Instagram Stories. Include story close button (X) in top right.",
    },
    "facebook-post": {
      uiDescription: `
- Profile section (name, avatar, timestamp)
- Main content/image
- Like, comment, share reactions below
- Comment preview section
- Action buttons (Like, Comment, Share)`,
      additionalRequirements:
        "Use Facebook's blue branding. Show realistic emoji reactions (like, love, haha, etc).",
    },
    "linkedin-post": {
      uiDescription: `
- Professional profile header
- Main image/content
- Engagement metrics (reactions, comments, shares)
- Share button and more options (...)
- Follow/Connect button
- Professional styling with gray/white theme`,
      additionalRequirements:
        "Use LinkedIn's professional color scheme. Include like, comment, share, send icons.",
    },
    "twitter-post": {
      uiDescription: `
- Author profile (avatar, name, @handle)
- Tweet text/caption
- Attached image
- Engagement metrics (retweets, likes, replies)
- Action buttons (reply, retweet, like, share)
- Timestamp`,
      additionalRequirements:
        "Use Twitter/X's current design. Show blue checkmark for verified accounts. Use modern icon styles.",
    },
    tiktok: {
      uiDescription: `
- Full-screen vertical video
- Right side action bar (like, comment, share, bookmark)
- Bottom section with username, description, sounds
- Trending audio indicator
- Engagement metrics on right side
- Video progress bar at bottom`,
      additionalRequirements:
        "Portrait orientation (1080x1920). Show TikTok's signature white/black theme. Include musical note icon for audio.",
    },
    "pinterest-pin": {
      uiDescription: `
- Pin image as main content
- Title and description below
- Save button (primary action)
- Pin source information
- Board name and owner info
- Related pins suggestion`,
      additionalRequirements:
        "Show Pinterest's red Save button prominently. Include P logo if appropriate.",
    },
  };

  return specs[platform];
}
