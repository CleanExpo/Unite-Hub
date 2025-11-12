import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
);

export async function GET(request: NextRequest) {
  try {
    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ],
      prompt: "consent",
    });

    return NextResponse.json({
      authUrl,
    });
  } catch (error: any) {
    console.error("Gmail authorization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
