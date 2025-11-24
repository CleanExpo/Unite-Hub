/**
 * Channel Execution Adapter Service
 * Phase 87: Real posting adapters for each platform
 */

import {
  ChannelExecutionRequest,
  ChannelExecutionResponse,
  PostingChannel,
} from './postingExecutionTypes';

/**
 * Execute post on specific channel
 */
export async function executeOnChannel(
  request: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  const adapter = getChannelAdapter(request.channel);
  return adapter(request);
}

/**
 * Get adapter for channel
 */
function getChannelAdapter(
  channel: PostingChannel
): (req: ChannelExecutionRequest) => Promise<ChannelExecutionResponse> {
  const adapters: Record<PostingChannel, any> = {
    fb: executeFacebook,
    ig: executeInstagram,
    tiktok: executeTikTok,
    linkedin: executeLinkedIn,
    youtube: executeYouTube,
    gmb: executeGMB,
    reddit: executeReddit,
    email: executeEmail,
    x: executeX,
  };

  return adapters[channel] || executeDemoAdapter;
}

// Facebook adapter
async function executeFacebook(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('fb', req.payload.content);
  }

  try {
    // Real Facebook Graph API implementation
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${req.credentials.pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: req.payload.content,
          access_token: req.credentials.accessToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        errorCode: data.error.code?.toString(),
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.id,
      url: `https://facebook.com/${data.id}`,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'FB_API_ERROR',
    };
  }
}

// Instagram adapter
async function executeInstagram(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('ig', req.payload.content);
  }

  // Instagram requires media container creation first
  try {
    // Step 1: Create media container
    const mediaUrl = req.payload.mediaUrls?.[0];

    if (!mediaUrl) {
      return {
        success: false,
        error: 'Instagram requires an image or video',
        errorCode: 'IG_NO_MEDIA',
      };
    }

    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${req.credentials.accountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption: req.payload.content,
          access_token: req.credentials.accessToken,
        }),
      }
    );

    const container = await containerResponse.json();

    if (container.error) {
      return {
        success: false,
        error: container.error.message,
        errorCode: container.error.code?.toString(),
        platformResponse: container,
      };
    }

    // Step 2: Publish container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${req.credentials.accountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: req.credentials.accessToken,
        }),
      }
    );

    const publish = await publishResponse.json();

    if (publish.error) {
      return {
        success: false,
        error: publish.error.message,
        errorCode: publish.error.code?.toString(),
        platformResponse: publish,
      };
    }

    return {
      success: true,
      postId: publish.id,
      url: `https://instagram.com/p/${publish.id}`,
      platformResponse: publish,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'IG_API_ERROR',
    };
  }
}

// TikTok adapter
async function executeTikTok(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('tiktok', req.payload.content);
  }

  // TikTok Content Posting API
  try {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/content/init/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: req.payload.content.substring(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: req.payload.mediaUrls?.[0],
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        errorCode: data.error.code,
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.data?.publish_id,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'TIKTOK_API_ERROR',
    };
  }
}

// LinkedIn adapter
async function executeLinkedIn(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('linkedin', req.payload.content);
  }

  try {
    const response = await fetch(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.credentials.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: `urn:li:person:${req.credentials.accountId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: req.payload.content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      }
    );

    const data = await response.json();

    if (data.status >= 400) {
      return {
        success: false,
        error: data.message,
        errorCode: data.status?.toString(),
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.id,
      url: `https://linkedin.com/feed/update/${data.id}`,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'LINKEDIN_API_ERROR',
    };
  }
}

// YouTube adapter
async function executeYouTube(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('youtube', req.payload.content);
  }

  // YouTube requires video upload - complex flow
  return {
    success: false,
    error: 'YouTube video upload requires additional setup',
    errorCode: 'YT_UPLOAD_REQUIRED',
  };
}

// Google My Business adapter
async function executeGMB(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('gmb', req.payload.content);
  }

  try {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${req.credentials.accountId}/locations/${req.credentials.pageId}/localPosts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode: 'en-US',
          summary: req.payload.content,
          topicType: 'STANDARD',
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        errorCode: data.error.code?.toString(),
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.name,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'GMB_API_ERROR',
    };
  }
}

// Reddit adapter
async function executeReddit(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('reddit', req.payload.content);
  }

  try {
    const subreddit = req.payload.metadata?.subreddit || 'test';

    const response = await fetch(
      'https://oauth.reddit.com/api/submit',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.credentials.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sr: subreddit,
          kind: 'self',
          title: req.payload.content.substring(0, 300),
          text: req.payload.content,
        }),
      }
    );

    const data = await response.json();

    if (data.json?.errors?.length > 0) {
      return {
        success: false,
        error: data.json.errors[0][1],
        errorCode: data.json.errors[0][0],
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.json?.data?.id,
      url: data.json?.data?.url,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'REDDIT_API_ERROR',
    };
  }
}

// Email adapter
async function executeEmail(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('email', req.payload.content);
  }

  // Use existing email service
  const { sendEmail } = await import('@/lib/email/email-service');

  const result = await sendEmail({
    to: req.payload.metadata?.to || '',
    subject: req.payload.metadata?.subject || 'Update',
    html: req.payload.content,
    text: req.payload.content.replace(/<[^>]*>/g, ''),
    provider: 'auto',
  });

  if (result.success) {
    return {
      success: true,
      postId: result.messageId,
      platformResponse: { provider: result.provider },
    };
  }

  return {
    success: false,
    error: result.error || 'Email send failed',
    errorCode: 'EMAIL_SEND_ERROR',
  };
}

// X (Twitter) adapter
async function executeX(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  if (req.dryRun || req.credentials.metadata?.demo) {
    return createDemoResponse('x', req.payload.content);
  }

  try {
    const response = await fetch(
      'https://api.twitter.com/2/tweets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: req.payload.content.substring(0, 280),
        }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      return {
        success: false,
        error: data.errors[0]?.message,
        errorCode: data.errors[0]?.code,
        platformResponse: data,
      };
    }

    return {
      success: true,
      postId: data.data?.id,
      url: `https://twitter.com/i/status/${data.data?.id}`,
      platformResponse: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'X_API_ERROR',
    };
  }
}

// Demo adapter
async function executeDemoAdapter(
  req: ChannelExecutionRequest
): Promise<ChannelExecutionResponse> {
  return createDemoResponse(req.channel, req.payload.content);
}

// Helper to create demo response
function createDemoResponse(
  channel: PostingChannel,
  content: string
): ChannelExecutionResponse {
  const demoId = `demo-${channel}-${Date.now()}`;

  return {
    success: true,
    postId: demoId,
    url: `https://demo.unite-hub.com/posts/${demoId}`,
    platformResponse: {
      demo: true,
      channel,
      content_preview: content.substring(0, 100),
      timestamp: new Date().toISOString(),
    },
  };
}
