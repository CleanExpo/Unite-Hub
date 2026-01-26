/**
 * Channel Testing API
 *
 * Endpoint for testing channel integrations
 *
 * POST /api/channels/test - Test channel execution
 * GET /api/channels/test - Get available channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import { executeChannel, getAvailableChannels, isChannelAvailable } from '@/lib/channels';

const logger = createApiLogger({ service: 'ChannelTestAPI' });

/**
 * Test channel execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_type, config, test_contact } = body;

    if (!channel_type) {
      return NextResponse.json(
        { error: 'channel_type is required' },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 });
    }

    // Use test contact or default
    const contact = test_contact || {
      id: 'test-contact-id',
      email: 'test@example.com',
      phone: '+11234567890',
      first_name: 'Test',
      last_name: 'User',
      company_name: 'Test Company',
    };

    logger.info('Testing channel', { channelType: channel_type, contactId: contact.id });

    // Execute channel
    const result = await executeChannel({
      type: channel_type,
      config,
      contact,
      variables: {
        test_variable: 'Test Value',
      },
      metadata: {
        test_mode: true,
      },
    });

    return NextResponse.json({
      success: result.success,
      channel_type,
      result: {
        provider: result.provider,
        message_id: result.messageId,
        post_id: result.postId,
        post_url: result.postUrl,
        error: result.error,
      },
    });
  } catch (error) {
    logger.error('Channel test failed', { error });

    return NextResponse.json(
      {
        error: 'Channel test failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get available channels and configuration status
 */
export async function GET(request: NextRequest) {
  try {
    const availableChannels = getAvailableChannels();

    const channelStatus = {
      email: {
        available: isChannelAvailable('email'),
        providers: {
          sendgrid: !!process.env.SENDGRID_API_KEY,
          resend: !!process.env.RESEND_API_KEY,
          smtp: !!(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD),
        },
      },
      sms: {
        available: isChannelAvailable('sms'),
        providers: {
          twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          aws_sns: !!(
            process.env.AWS_SNS_ACCESS_KEY_ID && process.env.AWS_SNS_SECRET_ACCESS_KEY
          ),
          vonage: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET),
        },
      },
      social: {
        available: isChannelAvailable('social'),
        platforms: {
          facebook: !!process.env.FACEBOOK_PAGE_ID,
          instagram: !!process.env.INSTAGRAM_ACCOUNT_ID,
          linkedin: !!process.env.LINKEDIN_ORG_ID,
          twitter: !!process.env.TWITTER_API_KEY,
          tiktok: !!process.env.TIKTOK_ACCESS_TOKEN,
          youtube: !!process.env.YOUTUBE_CHANNEL_ID,
        },
      },
      webhook: {
        available: true, // Always available
        configured: true,
      },
    };

    return NextResponse.json({
      success: true,
      available_channels: availableChannels,
      channel_status: channelStatus,
    });
  } catch (error) {
    logger.error('Failed to get channel status', { error });

    return NextResponse.json(
      {
        error: 'Failed to get channel status',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
