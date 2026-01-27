# Linear Webhooks Setup Guide

**Status**: ✅ Configured
**Webhook URL**: https://unite-group.in/api/integrations/linear/webhook
**Webhook Secret**: Added to `.env.local`

---

## What Are Webhooks?

Webhooks allow Linear to send real-time updates to Unite-Hub whenever:
- ✅ Issues are created, updated, or deleted
- ✅ Projects are modified
- ✅ Comments are added
- ✅ States change
- ✅ Labels are applied

This enables Unite-Hub to stay synchronized with Linear without polling.

---

## Configuration Status

✅ **Webhook Handler Created**: `/api/integrations/linear/webhook`
✅ **Webhook Secret Added**: Stored in `.env.local`
✅ **Signature Verification**: Enabled for security
✅ **Event Handlers**: Ready for Issue, Project, and Comment events

---

## Webhook URL Configuration

Your webhook is configured to receive events at:
```
https://unite-group.in/api/integrations/linear/webhook
```

**Important**: This must be a publicly accessible URL. If you're developing locally, you'll need to use a tunneling service like:
- **ngrok**: https://ngrok.com
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **VS Code Port Forwarding**: Built into VS Code

### Local Development with ngrok

If testing webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Create tunnel to your local server
ngrok http 3008

# Use the provided HTTPS URL in Linear webhook settings
# Example: https://abc123.ngrok.io/api/integrations/linear/webhook
```

---

## How It Works

### 1. Linear Sends Event

When something happens in Linear (issue created, updated, etc.), Linear sends an HTTP POST to your webhook URL.

### 2. Signature Verification

The webhook handler verifies the request came from Linear by:
- Checking the `linear-signature` header
- Computing HMAC-SHA256 of the payload
- Comparing with the signature

### 3. Event Processing

Based on the event type, the handler:
- Logs the event
- Calls the appropriate handler function
- Can trigger custom business logic

### 4. Response

Returns `200 OK` to Linear to confirm receipt.

---

## Supported Events

### Issue Events

```typescript
// Issue created
{
  action: 'create',
  type: 'Issue',
  data: {
    id: 'issue-id',
    identifier: 'UH-123',
    title: 'New feature request',
    state: { name: 'Todo', type: 'unstarted' },
    priority: 2
  }
}

// Issue updated
{
  action: 'update',
  type: 'Issue',
  data: {
    // Updated issue data
  }
}

// Issue deleted
{
  action: 'remove',
  type: 'Issue',
  data: {
    id: 'issue-id'
  }
}
```

### Project Events

```typescript
{
  action: 'create' | 'update' | 'remove',
  type: 'Project',
  data: {
    id: 'project-id',
    name: 'Q1 2026 Roadmap',
    state: 'started',
    progress: 0.45
  }
}
```

### Comment Events

```typescript
{
  action: 'create' | 'update' | 'remove',
  type: 'Comment',
  data: {
    id: 'comment-id',
    issueId: 'issue-id',
    body: 'Comment text',
    userId: 'user-id'
  }
}
```

---

## Implementing Business Logic

Edit `src/app/api/integrations/linear/webhook/route.ts` to add your custom logic:

### Example: Sync Issues to Database

```typescript
async function handleIssueEvent(action: string, issue: any) {
  if (action === 'create') {
    // Create task in Unite-Hub database
    await supabase.from('tasks').insert({
      linear_issue_id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.state.name,
      priority: issue.priority,
      assignee_id: issue.assigneeId,
    });
  }

  if (action === 'update') {
    // Update existing task
    await supabase
      .from('tasks')
      .update({
        title: issue.title,
        status: issue.state.name,
        priority: issue.priority,
      })
      .eq('linear_issue_id', issue.id);
  }

  if (action === 'remove') {
    // Delete task
    await supabase
      .from('tasks')
      .delete()
      .eq('linear_issue_id', issue.id);
  }
}
```

### Example: Send Notifications

```typescript
async function handleCommentEvent(action: string, comment: any) {
  if (action === 'create') {
    // Check for @mentions
    const mentions = comment.body.match(/@(\w+)/g);

    if (mentions) {
      // Send email notifications
      for (const mention of mentions) {
        await sendNotificationEmail({
          to: getUserEmail(mention),
          subject: 'You were mentioned in Linear',
          body: comment.body,
          issueUrl: comment.issue.url,
        });
      }
    }
  }
}
```

### Example: Trigger Automations

```typescript
async function handleIssueEvent(action: string, issue: any) {
  // Automatically assign issues based on labels
  if (action === 'create' && issue.labels.includes('bug')) {
    const bugTeamMember = await getNextAvailableBugFixer();

    await linearClient.updateIssue(issue.id, {
      assigneeId: bugTeamMember.id,
    });
  }

  // Auto-close related issues when main issue is completed
  if (action === 'update' && issue.state.type === 'completed') {
    const relatedIssues = await findRelatedIssues(issue.id);

    for (const related of relatedIssues) {
      await linearClient.updateIssue(related.id, {
        stateId: 'completed-state-id',
      });
    }
  }
}
```

---

## Testing Webhooks

### 1. Manual Testing with curl

```bash
curl -X POST https://unite-group.in/api/integrations/linear/webhook \
  -H "Content-Type: application/json" \
  -H "linear-signature: test-signature" \
  -d '{
    "action": "create",
    "type": "Issue",
    "data": {
      "id": "test-123",
      "identifier": "TEST-1",
      "title": "Test Issue"
    },
    "createdAt": "2026-01-27T12:00:00Z",
    "organizationId": "org-123",
    "webhookId": "webhook-123"
  }'
```

### 2. Check Logs

View webhook events in your server logs:

```bash
# Development
npm run dev
# Watch for: [Linear Webhook] Event received: { type: 'Issue', action: 'create' }

# Production
# Check your hosting provider's logs
```

### 3. Linear Webhook Testing

Linear provides a test feature in webhook settings:
1. Go to https://linear.app/unite-hub/settings/api/webhooks
2. Find your webhook
3. Click "Test webhook"
4. Linear will send a test event

---

## Troubleshooting

### Webhook Not Receiving Events

**Check**:
1. Is the webhook URL publicly accessible?
2. Is your server running?
3. Check Linear webhook settings: https://linear.app/unite-hub/settings/api/webhooks
4. Look for failed delivery attempts in Linear webhook logs

### "Invalid signature" Error

**Causes**:
- Wrong webhook secret in `.env.local`
- Webhook secret changed in Linear
- Body parsing issue

**Fix**:
1. Verify the secret in `.env.local` matches Linear
2. Check Linear webhook settings for the correct secret
3. Restart your server after changing `.env.local`

### Events Not Processing

**Check server logs** for errors:
```bash
[Linear Webhook] Error processing webhook: ...
```

Common issues:
- Database connection errors
- Missing permissions
- Validation errors in business logic

### Local Development Issues

If testing locally:
1. Use ngrok or similar tunneling service
2. Update Linear webhook URL to the tunnel URL
3. Make sure your local server is running
4. Check ngrok dashboard for request logs

---

## Security Best Practices

✅ **Signature Verification**: Always verify webhook signatures
✅ **HTTPS Only**: Never use HTTP for webhooks (exposes secrets)
✅ **Secret Storage**: Keep webhook secret in `.env.local`, not in code
✅ **Rate Limiting**: Consider adding rate limits to prevent abuse
✅ **Input Validation**: Validate all webhook data before processing
✅ **Error Handling**: Gracefully handle malformed payloads

---

## Monitoring

### Key Metrics to Track

- **Webhook Delivery Rate**: How many webhooks are received
- **Processing Time**: How long each webhook takes to process
- **Error Rate**: Percentage of webhooks that fail processing
- **Event Types**: Distribution of event types received

### Logging Best Practices

```typescript
// Log important events
console.log('[Linear Webhook] Issue created:', {
  id: issue.id,
  identifier: issue.identifier,
  timestamp: new Date().toISOString(),
});

// Log errors with context
console.error('[Linear Webhook] Failed to process:', {
  error: error.message,
  payload: payload,
  timestamp: new Date().toISOString(),
});
```

---

## Next Steps

1. ✅ **Webhook handler is ready** at `/api/integrations/linear/webhook`
2. ✅ **Webhook secret configured** in `.env.local`
3. 🔄 **Deploy to production** to make webhook publicly accessible
4. 🔄 **Configure in Linear** at https://linear.app/unite-hub/settings/api/webhooks
5. 🔄 **Implement custom business logic** in the webhook handler
6. 🔄 **Test with real events** from Linear

---

## Resources

- **Linear Webhooks Docs**: https://developers.linear.app/docs/graphql/webhooks
- **Your Webhook Settings**: https://linear.app/unite-hub/settings/api/webhooks
- **Webhook Handler Code**: `src/app/api/integrations/linear/webhook/route.ts`

---

**Last Updated**: 2026-01-27
**Status**: ✅ Ready for Production Deployment
