/**
 * Google Search Console MCP Skill
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import {
  buildGscAuthUrl,
  exchangeAuthCodeForTokens,
  refreshGscTokens,
  listGscProperties,
  verifyDomainOwnership,
  type GscTokenResponse,
  type GscProperty,
} from "@/lib/seo/integrations/gscClient";

import {
  linkGscCredentialToSeoProfile,
  getCredentialByType,
} from "@/lib/services/seo/credentialService";

import type { UserContext, SeoCredential } from "@/lib/seo/seoTypes";

export function gscGenerateAuthUrl(options: {
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

  return buildGscAuthUrl({
    redirect_uri: options.redirectUri,
    state,
    organization_id: options.organizationId,
  });
}

export async function gscExchangeAuthCode(options: {
  authCode: string;
  redirectUri: string;
}): Promise<GscTokenResponse> {
  return await exchangeAuthCodeForTokens(options.authCode, options.redirectUri);
}

export async function gscRefreshToken(options: {
  refreshToken: string;
}): Promise<GscTokenResponse> {
  return await refreshGscTokens(options.refreshToken);
}

export async function gscLinkCredential(options: {
  seoProfileId: string;
  tokenResponse: GscTokenResponse;
  propertyUrl?: string;
  userContext: UserContext;
}): Promise<{ success: boolean; error?: string; credential?: SeoCredential }> {
  const result = await linkGscCredentialToSeoProfile(
    {
      seo_profile_id: options.seoProfileId,
      token_response: options.tokenResponse,
      property_url: options.propertyUrl,
    },
    options.userContext
  );

  return {
    success: result.success,
    error: result.error,
    credential: result.data,
  };
}

export async function gscListProperties(options: {
  accessToken: string;
}): Promise<GscProperty[]> {
  return await listGscProperties(options.accessToken);
}

export async function gscVerifyDomain(options: {
  accessToken: string;
  siteUrl: string;
}): Promise<{ verified: boolean; method?: string }> {
  return await verifyDomainOwnership(options.accessToken, options.siteUrl);
}

export async function getGscCredential(options: {
  seoProfileId: string;
  userContext: UserContext;
}): Promise<SeoCredential | null> {
  const result = await getCredentialByType(
    options.seoProfileId,
    "gsc",
    options.userContext
  );
  return result.data || null;
}

export const gscSkillMetadata = {
  name: "gsc",
  description: "Google Search Console integration",
  version: "1.0.0",
};
