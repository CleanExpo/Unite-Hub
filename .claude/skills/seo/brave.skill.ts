/**
 * Brave Creator Console MCP Skill
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import {
  buildBraveAuthUrl,
  exchangeBraveAuthCode,
  refreshBraveTokens,
  validateBraveApiKeyFormat,
  braveListChannels,
  braveVerifyChannel,
  type BraveTokenResponse,
  type BraveChannel,
} from "@/lib/seo/integrations/braveClient";

import {
  linkBraveOAuthCredentialToSeoProfile,
  linkBraveApiKeyCredentialToSeoProfile,
  getCredentialByType,
} from "@/lib/services/seo/credentialService";

import type { UserContext, SeoCredential } from "@/lib/seo/seoTypes";

export function braveGenerateAuthUrl(options: {
  seoProfileId: string;
  organizationId: string;
  redirectUri: string;
}): string {
  const state = Buffer.from(
    JSON.stringify({
      seo_profile_id: options.seoProfileId,
      organization_id: options.organizationId,
      timestamp: Date.now(),
    })
  ).toString("base64url");

  return buildBraveAuthUrl({
    redirect_uri: options.redirectUri,
    state,
    organization_id: options.organizationId,
  });
}

export async function braveExchangeAuthCode(options: {
  authCode: string;
  redirectUri: string;
}): Promise<BraveTokenResponse> {
  return await exchangeBraveAuthCode(options.authCode, options.redirectUri);
}

export async function braveRefreshToken(options: {
  refreshToken: string;
}): Promise<BraveTokenResponse> {
  return await refreshBraveTokens(options.refreshToken);
}

export function braveValidateKeyFormat(apiKey: string): {
  valid: boolean;
  message?: string;
} {
  return validateBraveApiKeyFormat(apiKey);
}

export async function braveLinkOAuthCredential(options: {
  seoProfileId: string;
  tokenResponse: BraveTokenResponse;
  channelId?: string;
  userContext: UserContext;
}): Promise<{ success: boolean; error?: string; credential?: SeoCredential }> {
  const result = await linkBraveOAuthCredentialToSeoProfile(
    {
      seo_profile_id: options.seoProfileId,
      token_response: options.tokenResponse,
      channel_id: options.channelId,
    },
    options.userContext
  );

  return {
    success: result.success,
    error: result.error,
    credential: result.data,
  };
}

export async function braveLinkApiKeyCredential(options: {
  seoProfileId: string;
  apiKey: string;
  channelId?: string;
  userContext: UserContext;
}): Promise<{ success: boolean; error?: string; credential?: SeoCredential }> {
  const result = await linkBraveApiKeyCredentialToSeoProfile(
    {
      seo_profile_id: options.seoProfileId,
      api_key: options.apiKey,
      channel_id: options.channelId,
    },
    options.userContext
  );

  return {
    success: result.success,
    error: result.error,
    credential: result.data,
  };
}

export async function braveListChannelsForToken(
  accessTokenOrApiKey: string
): Promise<BraveChannel[]> {
  return await braveListChannels(accessTokenOrApiKey);
}

export async function braveVerifyChannelOwnership(options: {
  accessTokenOrApiKey: string;
  channelId: string;
}): Promise<{ verified: boolean; method?: string }> {
  return await braveVerifyChannel(options.accessTokenOrApiKey, options.channelId);
}

export async function getBraveCredential(options: {
  seoProfileId: string;
  userContext: UserContext;
}): Promise<SeoCredential | null> {
  const result = await getCredentialByType(
    options.seoProfileId,
    "brave_console",
    options.userContext
  );
  return result.data || null;
}

export const braveSkillMetadata = {
  name: "brave",
  description: "Brave Creator Console integration",
  version: "1.0.0",
};
