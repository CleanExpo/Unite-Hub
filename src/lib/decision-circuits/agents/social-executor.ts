/**
 * Social Media Execution Agent (AGENT_SOCIAL_EXECUTOR)
 * Autonomous execution-only agent for publishing pre-approved social media content
 * v1.3.0: First autonomous agent with circuit binding, CRM context, and metrics collection
 */

import { getSupabaseServer } from '@/lib/supabase';
import { executeCircuit, CircuitExecutionContext } from '../executor';
import { executeAutoCorrection } from '../autonomy';

/**
 * Platform credentials from synthex_social_accounts table
 */
export interface PlatformCredentials {
  facebook?: {
    page_id: string;
    access_token: string;
  };
  instagram?: {
    ig_user_id: string;
    access_token: string;
  };
  linkedin?: {
    organization_id: string;
    access_token: string;
  };
}

/**
 * Input to social publishing execution
 */
export interface SocialExecutorInput {
  circuit_execution_id: string; // MANDATORY - validates against circuit_execution_logs
  client_id: string; // Links to contacts/synthex_tenants
  platform: 'facebook' | 'instagram' | 'linkedin'; // Single platform per execution
  final_asset: {
    text_content: string;
    hashtags: string[];
    media_urls?: string[]; // Pre-uploaded URLs only (no upload)
    scheduled_for?: string; // ISO timestamp for scheduling
  };
  publish_time: string; // 'immediate' or ISO timestamp
}

/**
 * Output from social publishing execution
 */
export interface SocialExecutorOutput {
  published: boolean;
  platform_post_id?: string;
  platform_url?: string;
  published_at?: string;
  engagement_metrics?: {
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  };
  error?: string;
}

/**
 * CRM context for brand/business rules
 */
export interface CRMContext {
  business_type?: string;
  location?: string;
  brand_rules?: Record<string, unknown>;
  posting_preferences?: Record<string, unknown>;
  historical_engagement?: Record<string, number>;
}

/**
 * Required circuits that must pass before agent execution
 */
const REQUIRED_CIRCUITS = [
  'CX01_INTENT_DETECTION',
  'CX02_AUDIENCE_CLASSIFICATION',
  'CX03_STATE_MEMORY_RETRIEVAL',
  'CX04_CONTENT_STRATEGY_SELECTION',
  'CX05_BRAND_GUARD',
  'CX06_GENERATION_EXECUTION',
];

/**
 * Platform specifications (character limits, features)
 */
const PLATFORM_SPECS = {
  facebook: { max_length: 63206, supports_scheduling: true, supports_media: true },
  instagram: { max_length: 2200, supports_scheduling: true, supports_media: true },
  linkedin: { max_length: 3000, supports_scheduling: false, supports_media: true },
};

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  retryOn: [429, 500, 502, 503, 504], // Rate limits and server errors
};

/**
 * Validate that circuit_execution_id has passed all required circuits
 */
export async function validateCircuitBinding(
  circuitExecutionId: string,
  workspaceId: string
): Promise<{ valid: boolean; circuits_passed: string[]; missing: string[] }> {
  const supabase = getSupabaseServer();

  try {
    // Query circuit_execution_logs for all circuits with this execution_id
    const { data: logs, error } = await supabase
      .from('circuit_execution_logs')
      .select('circuit_id, success')
      .eq('execution_id', circuitExecutionId)
      .eq('workspace_id', workspaceId);

    if (error) {
      throw new Error(`Failed to validate circuit binding: ${error.message}`);
    }

    if (!logs || logs.length === 0) {
      return {
        valid: false,
        circuits_passed: [],
        missing: REQUIRED_CIRCUITS,
      };
    }

    // Check which required circuits passed
    const passedCircuits = logs
      .filter((log) => log.success && REQUIRED_CIRCUITS.includes(log.circuit_id))
      .map((log) => log.circuit_id);

    const missingCircuits = REQUIRED_CIRCUITS.filter(
      (circuit) => !passedCircuits.includes(circuit)
    );

    return {
      valid: missingCircuits.length === 0,
      circuits_passed: passedCircuits,
      missing: missingCircuits,
    };
  } catch (error) {
    throw new Error(
      `Circuit binding validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get read-only CRM context for client
 */
export async function getCRMContext(
  clientId: string,
  workspaceId: string
): Promise<CRMContext> {
  const supabase = getSupabaseServer();

  try {
    // Query contacts for basic business info
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('company, tags')
      .eq('id', clientId)
      .eq('workspace_id', workspaceId)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable for non-contacts)
      console.warn('Contact lookup failed:', contactError);
    }

    // Try Synthex tenant profile for brand info
    const crmContext: CRMContext = {};

    if (contact) {
      crmContext.business_type = contact.company || undefined;
    }

    // Return read-only context (add more fields as needed from database)
    return crmContext;
  } catch (error) {
    throw new Error(
      `Failed to read CRM context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delay function for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if error should be retried
 */
function shouldRetry(error: unknown, statusCode?: number): boolean {
  if (statusCode && RETRY_CONFIG.retryOn.includes(statusCode)) {
    return true;
  }
  if (error instanceof Error && error.message.includes('timeout')) {
    return true;
  }
  return false;
}

/**
 * Publish to Facebook using Graph API
 */
export async function publishToFacebook(
  asset: SocialExecutorInput['final_asset'],
  credentials: PlatformCredentials['facebook'],
  schedule?: boolean
): Promise<{ post_id: string; url: string }> {
  if (!credentials) {
    throw new Error('Facebook credentials not configured');
  }

  const message = [asset.text_content, ...asset.hashtags].filter(Boolean).join('\n');

  // Validate content length
  if (message.length > PLATFORM_SPECS.facebook.max_length) {
    throw new Error(
      `Content exceeds Facebook limit (${message.length}/${PLATFORM_SPECS.facebook.max_length})`
    );
  }

  const payload: Record<string, unknown> = {
    message,
    access_token: credentials.access_token,
  };

  // Handle scheduling
  if (schedule && asset.scheduled_for) {
    payload.scheduled_publish_time = Math.floor(
      new Date(asset.scheduled_for).getTime() / 1000
    );
    payload.published = false;
  } else {
    payload.published = true;
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${credentials.page_id}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Facebook API error (${response.status}): ${await response.text()}`
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    post_id: String(data.id),
    url: `https://facebook.com/${data.id}`,
  };
}

/**
 * Publish to Instagram using Graph API
 */
export async function publishToInstagram(
  asset: SocialExecutorInput['final_asset'],
  credentials: PlatformCredentials['instagram'],
  schedule?: boolean
): Promise<{ post_id: string; url: string }> {
  if (!credentials) {
    throw new Error('Instagram credentials not configured');
  }

  const caption = [asset.text_content, ...asset.hashtags].filter(Boolean).join('\n');

  // Validate content length
  if (caption.length > PLATFORM_SPECS.instagram.max_length) {
    throw new Error(
      `Caption exceeds Instagram limit (${caption.length}/${PLATFORM_SPECS.instagram.max_length})`
    );
  }

  // For images: use Graph API media endpoint
  // Media container approach for IGContent
  const payload: Record<string, unknown> = {
    user_id: credentials.ig_user_id,
    caption,
    access_token: credentials.access_token,
  };

  if (asset.media_urls && asset.media_urls.length > 0) {
    // Single image post
    payload.image_url = asset.media_urls[0];
  }

  // Handle scheduling
  if (schedule && asset.scheduled_for) {
    payload.scheduled_publish_time = Math.floor(
      new Date(asset.scheduled_for).getTime() / 1000
    );
    payload.user_id = credentials.ig_user_id;
  }

  const response = await fetch(
    `https://graph.instagram.com/v19.0/${credentials.ig_user_id}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Instagram API error (${response.status}): ${await response.text()}`
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    post_id: String(data.id),
    url: `https://instagram.com/p/${data.id}`,
  };
}

/**
 * Publish to LinkedIn using REST API
 */
export async function publishToLinkedIn(
  asset: SocialExecutorInput['final_asset'],
  credentials: PlatformCredentials['linkedin']
): Promise<{ post_id: string; url: string }> {
  if (!credentials) {
    throw new Error('LinkedIn credentials not configured');
  }

  const content = [asset.text_content, ...asset.hashtags].filter(Boolean).join('\n');

  // Validate content length
  if (content.length > PLATFORM_SPECS.linkedin.max_length) {
    throw new Error(
      `Content exceeds LinkedIn limit (${content.length}/${PLATFORM_SPECS.linkedin.max_length})`
    );
  }

  // LinkedIn doesn't support scheduling via API, publish immediately
  const payload = {
    author: `urn:li:organization:${credentials.organization_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.PublishOpen': {
        shareMediaCategory: 'ARTICLE',
        shareContent: {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `LinkedIn API error (${response.status}): ${await response.text()}`
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    post_id: String(data.id),
    url: `https://linkedin.com/feed/update/${data.id}`,
  };
}

/**
 * Publish with retry logic (exponential backoff)
 */
async function publishWithRetry(
  publishFn: () => Promise<{ post_id: string; url: string }>,
  platform: string,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<{ post_id: string; url: string; attempt: number; success: boolean }> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await publishFn();
      return { ...result, attempt: attempt + 1, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = parseInt(errorMessage.match(/\((\d+)\)/)?.[1] || '0');

      if (attempt < maxRetries && shouldRetry(error, statusCode)) {
        const delayMs = RETRY_CONFIG.initialDelayMs *
          Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);

        console.log(
          `Publish attempt ${attempt + 1} failed for ${platform}, retrying in ${delayMs}ms: ${errorMessage}`
        );

        await delay(delayMs);
        attempt++;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}

/**
 * Collect engagement metrics from platform
 */
export async function collectEngagementMetrics(
  _platform: string,
  _postId: string,
  _credentials: PlatformCredentials
): Promise<SocialExecutorOutput['engagement_metrics']> {
  // Placeholder: In production, fetch from platform APIs
  // Facebook: GET /{post_id}?fields=insights.metric(...)
  // Instagram: GET /{media_id}?fields=like_count,comments_count
  // LinkedIn: GET /socialActions/{shareUrn}/statistics

  return {
    impressions: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    clicks: 0,
  };
}

/**
 * Execute social media publishing with full circuit validation and retry logic
 */
export async function executeSocialPublishing(
  inputs: SocialExecutorInput,
  context: CircuitExecutionContext
): Promise<SocialExecutorOutput> {
  const supabase = getSupabaseServer();

  try {
    // STEP 1: Validate circuit binding (hard fail if any required circuit missing)
    const circuitValidation = await validateCircuitBinding(
      inputs.circuit_execution_id,
      context.workspace_id
    );

    if (!circuitValidation.valid) {
      throw new Error(
        `Circuit validation failed. Missing circuits: ${circuitValidation.missing.join(', ')}`
      );
    }

    // STEP 2: Get CRM context (read-only)
    // TODO: Use crmContext for brand validation in future versions
    await getCRMContext(inputs.client_id, context.workspace_id);

    // STEP 3: Log execution start
    const executionStartLog = {
      workspace_id: context.workspace_id,
      circuit_execution_id: inputs.circuit_execution_id,
      client_id: inputs.client_id,
      platform: inputs.platform,
      published: false,
      text_content: inputs.final_asset.text_content,
      hashtags: inputs.final_asset.hashtags,
      media_urls: inputs.final_asset.media_urls || [],
      scheduled_for: inputs.final_asset.scheduled_for || null,
      attempt_number: 1,
      retry_count: 0,
    };

    const { data: executionRecord, error: insertError } = await supabase
      .from('social_agent_executions')
      .insert([executionStartLog])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to log execution start: ${insertError.message}`);
    }

    // STEP 4: Get platform credentials
    const { data: platformAccount, error: accountError } = await supabase
      .from('synthex_social_accounts')
      .select('*')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', inputs.platform)
      .single();

    if (accountError || !platformAccount) {
      throw new Error(`No ${inputs.platform} account configured for workspace`);
    }

    // Build credentials
    const credentials: PlatformCredentials = {};
    if (inputs.platform === 'facebook') {
      credentials.facebook = {
        page_id: platformAccount.page_id,
        access_token: platformAccount.access_token_encrypted, // In production, decrypt
      };
    } else if (inputs.platform === 'instagram') {
      credentials.instagram = {
        ig_user_id: platformAccount.ig_user_id,
        access_token: platformAccount.access_token_encrypted, // In production, decrypt
      };
    } else if (inputs.platform === 'linkedin') {
      credentials.linkedin = {
        organization_id: platformAccount.organization_id,
        access_token: platformAccount.access_token_encrypted, // In production, decrypt
      };
    }

    // STEP 5: Publish with retry logic
    let publishResult;
    let retryCount = 0;
    let lastError: Error | null = null;

    try {
      if (inputs.platform === 'facebook') {
        publishResult = await publishWithRetry(() =>
          publishToFacebook(
            inputs.final_asset,
            credentials.facebook,
            !!inputs.final_asset.scheduled_for
          )
        );
      } else if (inputs.platform === 'instagram') {
        publishResult = await publishWithRetry(() =>
          publishToInstagram(
            inputs.final_asset,
            credentials.instagram,
            !!inputs.final_asset.scheduled_for
          )
        );
      } else if (inputs.platform === 'linkedin') {
        publishResult = await publishWithRetry(() =>
          publishToLinkedIn(inputs.final_asset, credentials.linkedin)
        );
      } else {
        throw new Error(`Unsupported platform: ${inputs.platform}`);
      }

      retryCount = publishResult.attempt - 1;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = RETRY_CONFIG.maxRetries;

      // STEP 6: On repeated failure, trigger CX08_SELF_CORRECTION
      if (retryCount >= RETRY_CONFIG.maxRetries) {
        try {
          const correctionInputs = {
            circuit_id: 'AGENT_SOCIAL_EXECUTOR',
            failure_reason: `Publishing to ${inputs.platform} failed after ${retryCount} retries`,
            current_strategy: inputs.platform,
            performance_metrics: {
              success_rate: 0,
              retry_count: retryCount,
              last_error: lastError.message,
            },
          };

          await executeCircuit(
            'CX08_SELF_CORRECTION',
            correctionInputs,
            context,
            executeAutoCorrection
          );
        } catch (correctionError) {
          console.error('Failed to trigger self-correction:', correctionError);
        }
      }

      // Return failure response
      const updateError = await supabase
        .from('social_agent_executions')
        .update({
          published: false,
          retry_count: retryCount,
          last_error: lastError.message,
        })
        .eq('id', executionRecord.id);

      if (updateError.error) {
        console.error('Failed to update execution record:', updateError.error);
      }

      return {
        published: false,
        error: lastError.message,
      };
    }

    // STEP 7: Update execution record with success
    const publishedAt = inputs.final_asset.scheduled_for || new Date().toISOString();

    const updateResult = await supabase
      .from('social_agent_executions')
      .update({
        published: true,
        platform_post_id: publishResult.post_id,
        platform_url: publishResult.url,
        published_at: publishedAt,
        retry_count: retryCount,
      })
      .eq('id', executionRecord.id)
      .select()
      .single();

    if (updateResult.error) {
      throw new Error(`Failed to update execution record: ${updateResult.error.message}`);
    }

    return {
      published: true,
      platform_post_id: publishResult.post_id,
      platform_url: publishResult.url,
      published_at: publishedAt,
    };
  } catch (error) {
    throw new Error(
      `Social publishing failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
