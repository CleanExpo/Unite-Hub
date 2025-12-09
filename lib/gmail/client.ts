import { google } from "googleapis";

/**
 * Gmail API Client Configuration
 * Handles OAuth2 authentication and Gmail API initialization
 */

export interface GmailCredentials {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}

export class GmailClient {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/email/oauth/callback`
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.metadata",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state || "",
      prompt: "consent",
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GmailCredentials> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      };
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw new Error("Failed to exchange authorization code");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GmailCredentials> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || refreshToken,
        expiryDate: credentials.expiry_date,
      };
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  /**
   * Get Gmail API client with credentials
   */
  getGmailAPI(credentials: GmailCredentials) {
    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiryDate,
    });

    return google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  /**
   * Get user's Gmail profile
   */
  async getUserProfile(credentials: GmailCredentials) {
    const gmail = this.getGmailAPI(credentials);
    const profile = await gmail.users.getProfile({ userId: "me" });
    return profile.data;
  }

  /**
   * Check if token needs refresh
   */
  needsTokenRefresh(expiryDate?: number): boolean {
    if (!expiryDate) {
return false;
}
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return now >= (expiryDate - bufferTime);
  }
}

// Export singleton instance
export const gmailClient = new GmailClient();
