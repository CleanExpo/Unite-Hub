/**
 * Bing Webmaster MCP Skill
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import {
  validateApiKeyFormat,
  validateBingApiKey,
  bingListSites,
  bingVerifySiteOwnership,
  bingAddSite,
  type BingApiKeyValidation,
  type BingSite,
} from "@/lib/seo/integrations/bingClient";

import {
  linkBingCredentialToSeoProfile,
  getCredentialByType,
} from "@/lib/services/seo/credentialService";

import type { UserContext, SeoCredential } from "@/lib/seo/seoTypes";

export function bingValidateKeyFormat(apiKey: string): BingApiKeyValidation {
  return validateApiKeyFormat(apiKey);
}

export async function bingValidateKey(apiKey: string): Promise<BingApiKeyValidation> {
  return await validateBingApiKey(apiKey);
}

export async function bingLinkCredential(options: {
  seoProfileId: string;
  apiKey: string;
  verifiedSites?: string[];
  userContext: UserContext;
}): Promise<{ success: boolean; error?: string; credential?: SeoCredential }> {
  const result = await linkBingCredentialToSeoProfile(
    {
      seo_profile_id: options.seoProfileId,
      api_key: options.apiKey,
      verified_sites: options.verifiedSites,
    },
    options.userContext
  );

  return {
    success: result.success,
    error: result.error,
    credential: result.data,
  };
}

export async function bingListSitesForKey(apiKey: string): Promise<BingSite[]> {
  return await bingListSites(apiKey);
}

export async function bingVerifySite(options: {
  apiKey: string;
  siteUrl: string;
}): Promise<{ verified: boolean; method?: string }> {
  return await bingVerifySiteOwnership(options.apiKey, options.siteUrl);
}

export async function bingAddNewSite(options: {
  apiKey: string;
  siteUrl: string;
}): Promise<{ success: boolean; message?: string }> {
  return await bingAddSite(options.apiKey, options.siteUrl);
}

export async function getBingCredential(options: {
  seoProfileId: string;
  userContext: UserContext;
}): Promise<SeoCredential | null> {
  const result = await getCredentialByType(
    options.seoProfileId,
    "bing_webmaster",
    options.userContext
  );
  return result.data || null;
}

export const bingSkillMetadata = {
  name: "bing",
  description: "Bing Webmaster API integration",
  version: "1.0.0",
};
