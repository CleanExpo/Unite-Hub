# WhatsApp Integration - Quick Start

**5-minute setup guide for WhatsApp Business messaging**

## Step 1: Get WhatsApp Credentials (10 minutes)

1. **Create Meta Business Account**
   - Go to https://business.facebook.com/
   - Create account or log in
   - Verify your business

2. **Set Up WhatsApp API**
   - Go to https://developers.facebook.com/
   - Create new app or select existing
   - Add "WhatsApp" product
   - Verify your phone number

3. **Get Credentials**
   - Go to WhatsApp > API Setup
   - Copy these values:
     ```
     Phone Number ID: [copy from dashboard]
     Access Token: [click "Show" to copy]
     Business Account ID: [copy from dashboard]
     ```

4. **Create Verify Token**
   - Generate a random string (any text you want)
   - Example: `my-whatsapp-webhook-token-2025`
   - Save it for later

5. **Get App Secret**
   - Go to Settings > Basic
   - Click "Show" next to App Secret
   - Copy the value

## Step 2: Configure Environment (2 minutes)

Add to your `.env.local`:

```env
WHATSAPP_PHONE_NUMBER_ID=paste_here
WHATSAPP_ACCESS_TOKEN=paste_here
WHATSAPP_BUSINESS_ACCOUNT_ID=paste_here
WHATSAPP_VERIFY_TOKEN=your_random_string
WHATSAPP_APP_SECRET=paste_here
```

## Step 3: Run Database Migration (1 minute)

```bash
# Apply WhatsApp tables to Supabase
npm run db:migrate

# Or manually via Supabase Dashboard:
# - Go to SQL Editor
# - Copy/paste contents of: supabase/migrations/004_whatsapp_integration.sql
# - Click Run
```

## Step 4: Set Up Webhook (3 minutes)

### Option A: Production (with live domain)

1. Deploy your app to production
2. In Meta app dashboard > WhatsApp > Configuration
3. Click "Edit" next to Webhook
4. Enter:
   ```
   URL: https://yourdomain.com/api/webhooks/whatsapp
   Verify Token: [same as WHATSAPP_VERIFY_TOKEN]
   ```
5. Click "Verify and Save"
6. Subscribe to: `messages` and `message_status`

### Option B: Local Testing (with ngrok)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3008

# Copy the ngrok URL (https://abc123.ngrok.io)
# Use in Meta dashboard:
# URL: https://abc123.ngrok.io/api/webhooks/whatsapp
```

## Step 5: Test It! (2 minutes)

1. **Send test message**
   - From your phone, send a WhatsApp message to your business number
   - Example: "Hello, testing!"

2. **Check database**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5;
   ```
   You should see your message!

3. **View in UI**
   - Go to: http://localhost:3008/dashboard/messages/whatsapp
   - You should see the conversation

4. **Send reply**
   - Click on the conversation
   - Type a reply and hit Send
   - Check your phone - you should receive it!

## Troubleshooting

### Webhook verification fails
- Check that WHATSAPP_VERIFY_TOKEN matches in both .env and Meta dashboard
- Ensure your server is running
- If using ngrok, make sure the tunnel is active

### Messages not appearing
```sql
-- Check webhook logs
SELECT * FROM whatsapp_webhooks ORDER BY received_at DESC LIMIT 5;

-- Check for errors
SELECT * FROM whatsapp_webhooks WHERE processed = false;
```

### Can't send messages
- Verify WHATSAPP_ACCESS_TOKEN is valid
- Check phone number format (no + symbol, just digits)
- Ensure WHATSAPP_PHONE_NUMBER_ID is correct

### AI not processing
- Check ANTHROPIC_API_KEY is set
- Look for errors in server logs
- Verify message has `ai_summary` field:
  ```sql
  SELECT id, content, ai_summary, sentiment FROM whatsapp_messages LIMIT 5;
  ```

## Quick Commands

```bash
# View recent messages
SELECT phone_number, direction, content, sentiment
FROM whatsapp_messages
ORDER BY created_at DESC
LIMIT 10;

# View conversations
SELECT phone_number, status, unread_count, last_message_at
FROM whatsapp_conversations
ORDER BY last_message_at DESC;

# Check AI processing
SELECT COUNT(*) as total,
       COUNT(ai_summary) as processed,
       COUNT(*) - COUNT(ai_summary) as pending
FROM whatsapp_messages
WHERE direction = 'inbound';
```

## What's Next?

1. **Create Templates**: Go to Meta Business Manager > WhatsApp > Message Templates
2. **Enable Auto-Response**: Uncomment auto-response code in webhook handler
3. **Customize UI**: Modify `src/app/dashboard/messages/whatsapp/page.tsx`
4. **Add Team**: Assign conversations to team members
5. **Set Up Campaigns**: Integrate with drip campaigns

## API Usage

### Send a message via code

```typescript
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'your-workspace-id',
    phoneNumber: '1234567890',
    messageType: 'text',
    content: 'Hello from Unite-Hub!'
  })
});
```

### Get conversations

```typescript
const response = await fetch(
  `/api/whatsapp/conversations?workspaceId=${workspaceId}`
);
const { conversations } = await response.json();
```

## Common Use Cases

### Send welcome message
```typescript
await whatsappService.sendTemplateMessage(
  customerPhone,
  'welcome_message',
  'en'
);
```

### Send image with caption
```typescript
await whatsappService.sendImageMessage(
  customerPhone,
  'https://example.com/product.jpg',
  'Check out our new product!'
);
```

### Check message status
```sql
SELECT whatsapp_message_id, status, sent_at, delivered_at, read_at
FROM whatsapp_messages
WHERE direction = 'outbound'
ORDER BY created_at DESC
LIMIT 10;
```

## Resources

- **Full Setup**: `docs/WHATSAPP_SETUP.md`
- **Documentation**: `WHATSAPP_INTEGRATION.md`
- **Build Summary**: `WHATSAPP_BUILD_SUMMARY.md`
- **Meta Docs**: https://developers.facebook.com/docs/whatsapp
- **Environment Template**: `.env.whatsapp.example`

## Support

If you get stuck:
1. Check `docs/WHATSAPP_SETUP.md` for detailed instructions
2. Review Meta Business API documentation
3. Check server logs for errors
4. Verify all environment variables are set

---

**That's it!** You should now have WhatsApp messaging working in your CRM.

Total setup time: ~20 minutes (plus Meta verification if needed)
