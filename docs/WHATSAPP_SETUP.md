# WhatsApp Business Integration Setup Guide

Complete guide for setting up WhatsApp Business messaging in Unite-Hub CRM.

## Overview

The WhatsApp integration provides:
- **Bi-directional messaging**: Send and receive WhatsApp messages
- **AI Intelligence**: Automatic sentiment analysis, intent detection, and response suggestions
- **Conversation management**: Thread-based conversations with read/unread tracking
- **Template messages**: Pre-approved marketing and utility templates
- **Contact sync**: Automatic contact creation and intelligence updates
- **Webhook processing**: Real-time message delivery and status updates

## Prerequisites

1. **WhatsApp Business Account**: You need a verified WhatsApp Business account
2. **Meta Business Account**: Required to access WhatsApp Business API
3. **Phone Number**: A dedicated phone number for WhatsApp Business
4. **Anthropic API Key**: For AI message processing (already configured)

## Setup Options

### Option 1: WhatsApp Cloud API (Recommended)

**Pros**: Official, free tier available, full features
**Cons**: Requires Meta Business verification

#### Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create or select your business account
3. Complete business verification (may take 1-3 days)

#### Step 2: Set Up WhatsApp Business API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add "WhatsApp" product to your app
4. Complete the setup wizard:
   - Select your business account
   - Add your phone number
   - Verify your phone number (you'll receive a code via SMS)

#### Step 3: Get API Credentials

1. In your app dashboard, go to WhatsApp > API Setup
2. Copy the following credentials:
   - **Temporary Access Token** (expires in 24 hours - you'll need to generate a permanent one)
   - **Phone Number ID**
   - **WhatsApp Business Account ID**

3. To generate a permanent access token:
   - Go to Settings > Business Settings > System Users
   - Create a system user
   - Assign the "WhatsApp Business Management" and "WhatsApp Business Messaging" permissions
   - Generate a permanent token

#### Step 4: Configure Environment Variables

Add to your `.env.local`:

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_APP_SECRET=your_app_secret

# Default workspace (optional - for webhook routing)
DEFAULT_WORKSPACE_ID=your_workspace_uuid
```

**Important**:
- `WHATSAPP_VERIFY_TOKEN` can be any random string you create (e.g., `my-secure-verify-token-12345`)
- `WHATSAPP_APP_SECRET` is found in Settings > Basic > App Secret (click "Show")

#### Step 5: Set Up Webhook

1. In your Meta app dashboard, go to WhatsApp > Configuration
2. Click "Edit" next to Webhook
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/whatsapp
   ```
4. Enter the verify token (same as `WHATSAPP_VERIFY_TOKEN` in .env)
5. Click "Verify and Save"
6. Subscribe to webhook fields:
   - ✅ messages
   - ✅ message_status

#### Step 6: Test Your Setup

1. Send a test message to your WhatsApp Business number
2. Check your database:
   ```sql
   SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;
   ```
3. Check webhook logs:
   ```sql
   SELECT * FROM whatsapp_webhooks ORDER BY received_at DESC LIMIT 10;
   ```

---

### Option 2: Twilio WhatsApp API

**Pros**: Easier setup, no business verification needed for testing
**Cons**: Costs per message, sandbox for testing only

#### Step 1: Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Go to Messaging > Try it out > Try WhatsApp

#### Step 2: Set Up Sandbox

1. Follow Twilio's sandbox setup instructions
2. Send the join code to the sandbox number
3. Get your credentials:
   - Account SID
   - Auth Token
   - WhatsApp-enabled phone number

#### Step 3: Configure for Twilio

Create a new service file `src/lib/services/whatsapp-twilio.ts`:

```typescript
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function sendTwilioWhatsAppMessage(to: string, message: string) {
  return await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message
  });
}
```

Add to `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## Database Setup

Run the migration to create WhatsApp tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# Copy contents of: supabase/migrations/004_whatsapp_integration.sql
```

This creates:
- `whatsapp_messages` - All WhatsApp messages (inbound/outbound)
- `whatsapp_conversations` - Conversation threads
- `whatsapp_templates` - Pre-approved message templates
- `whatsapp_webhooks` - Webhook event logs

## Template Messages

WhatsApp requires pre-approval for marketing templates.

### Creating a Template

1. Go to Meta Business Manager > WhatsApp Manager
2. Click "Message Templates" > "Create Template"
3. Fill in:
   - **Category**: Marketing, Utility, or Authentication
   - **Name**: template_name (lowercase, underscores only)
   - **Language**: Select language
   - **Header** (optional): Text, image, video, or document
   - **Body**: Your message text (use {{1}}, {{2}} for variables)
   - **Footer** (optional): Additional info
   - **Buttons** (optional): Call-to-action, Quick reply

4. Submit for approval (typically approved within 24 hours)

### Using Templates in Code

```typescript
// Send approved template
await whatsappService.sendTemplateMessage(
  phoneNumber,
  'welcome_message',
  'en',
  [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John' },
        { type: 'text', text: 'Premium Plan' }
      ]
    }
  ]
);
```

### Save Template in Database

```typescript
await db.whatsappTemplates.create({
  workspace_id: workspaceId,
  template_name: 'welcome_message',
  category: 'utility',
  language: 'en',
  body_content: 'Hello {{1}}, welcome to {{2}}!',
  variables: ['name', 'plan'],
  status: 'approved',
  whatsapp_template_id: 'meta_template_id'
});
```

## AI Processing

The system automatically processes incoming messages with Claude AI:

1. **Message Analysis**:
   - Extracts intent (question, complaint, request, etc.)
   - Analyzes sentiment (positive, neutral, negative, urgent)
   - Generates summary
   - Determines if response is needed
   - Suggests automated response

2. **Contact Intelligence**:
   - Updates AI score based on conversation
   - Adds relevant tags
   - Updates contact status
   - Creates tasks if needed

3. **Auto-Response** (optional):
   Enable in code by uncommenting in webhook handler:
   ```typescript
   if (analysis.requires_response && analysis.suggested_response) {
     await whatsappService.sendTextMessage(
       phoneNumber,
       analysis.suggested_response
     );
   }
   ```

## API Endpoints

### Send Message

```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "workspaceId": "uuid",
  "phoneNumber": "1234567890",
  "messageType": "text",
  "content": "Hello from Unite-Hub!"
}
```

### Get Conversations

```bash
GET /api/whatsapp/conversations?workspaceId=uuid&status=open
```

### Get Messages

```bash
GET /api/whatsapp/conversations/{id}/messages?limit=50
```

### List Templates

```bash
GET /api/whatsapp/templates?workspaceId=uuid&status=approved
```

## UI Components

### WhatsApp Dashboard

Access at: `/dashboard/messages/whatsapp`

Features:
- Conversation list with search
- Real-time message thread
- Send text messages
- AI insights display
- Sentiment badges
- Read/delivery receipts
- Archive conversations

### WhatsAppChat Component

Reusable chat interface:

```tsx
<WhatsAppChat
  conversation={conversation}
  workspaceId={workspaceId}
  onUpdate={refreshConversations}
/>
```

## Testing

### Test Webhook Locally

Use ngrok to expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose port 3008
ngrok http 3008

# Use the ngrok URL as your webhook URL:
# https://abc123.ngrok.io/api/webhooks/whatsapp
```

### Send Test Message

```bash
curl -X POST https://your-domain.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-id",
    "phoneNumber": "1234567890",
    "messageType": "text",
    "content": "Test message"
  }'
```

## Production Checklist

- [ ] WhatsApp Business account verified
- [ ] Permanent access token generated
- [ ] Webhook URL configured and verified
- [ ] Environment variables set in production
- [ ] Database migration applied
- [ ] SSL certificate active (required for webhooks)
- [ ] Message templates approved
- [ ] AI processing tested
- [ ] Rate limits configured (WhatsApp has limits)
- [ ] Error monitoring set up
- [ ] Backup webhook URL configured (optional)

## Rate Limits

WhatsApp Cloud API limits:
- **Free tier**: 1,000 conversations/month
- **Business verification required**: For higher limits
- **Template messages**: Limited to contacts who opted in
- **Session window**: 24 hours after last user message

## Troubleshooting

### Webhook Not Receiving Messages

1. Check webhook verification:
   ```bash
   curl "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test"
   ```
   Should return: `test`

2. Check webhook logs:
   ```sql
   SELECT * FROM whatsapp_webhooks WHERE processed = false;
   ```

3. Verify webhook subscription in Meta app dashboard

### Messages Not Sending

1. Check access token validity
2. Verify phone number format (should be digits only, no +)
3. Check API response for errors:
   ```typescript
   console.error('WhatsApp API error:', error);
   ```

### AI Processing Failing

1. Check Anthropic API key
2. Verify Claude model ID is correct
3. Check message content length (very long messages may timeout)

## Security Best Practices

1. **Verify Webhook Signatures**: Enabled by default
2. **Use Environment Variables**: Never commit credentials
3. **Rotate Access Tokens**: Periodically regenerate tokens
4. **Rate Limiting**: Implement on your API endpoints
5. **Content Validation**: Sanitize user inputs
6. **HTTPS Required**: WhatsApp requires SSL for webhooks

## Next Steps

1. Set up message templates for common responses
2. Configure auto-response rules
3. Train team on WhatsApp interface
4. Monitor conversation analytics
5. Integrate with drip campaigns
6. Set up WhatsApp-triggered workflows

## Support

- WhatsApp Cloud API Docs: https://developers.facebook.com/docs/whatsapp
- Meta Business Support: https://business.facebook.com/help
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Unite-Hub Issues: Create GitHub issue

---

**Built with Unite-Hub CRM** | Last updated: 2025-11-15
