# Claude AI Integration - Quick Start Guide

## Setup (5 minutes)

### 1. Environment Variables

Copy the example environment file:
```bash
cp .env.claude.example .env.local
```

Add your Anthropic API key to `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 2. Verify Installation

The `@anthropic-ai/sdk` package is already installed. To verify:
```bash
npm list @anthropic-ai/sdk
```

## Basic Usage

### Auto-Reply Generation

```typescript
import { aiClient } from '@/lib/claude';

const result = await aiClient.autoReply({
  from: 'client@example.com',
  subject: 'Need help with marketing',
  body: 'I am looking for marketing services...',
});

console.log(result.questions);
```

### Using React Hooks

```typescript
'use client';

import { useAutoReply } from '@/lib/claude';

function MyComponent() {
  const { data, loading, error, execute } = useAutoReply();

  const handleClick = async () => {
    await execute({
      from: 'client@example.com',
      subject: 'Inquiry',
      body: 'I need help...',
    });
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Auto-Reply'}
    </button>
  );
}
```

## API Testing

### Test Single Endpoint

```bash
curl http://localhost:3008/api/ai/auto-reply -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "subject": "Test",
    "body": "Test email body"
  }'
```

### Test All Endpoints

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3008/api/ai/auto-reply
curl http://localhost:3008/api/ai/persona
curl http://localhost:3008/api/ai/strategy
curl http://localhost:3008/api/ai/campaign
curl http://localhost:3008/api/ai/hooks
curl http://localhost:3008/api/ai/mindmap
```

## Code Examples

### 1. Generate Auto-Reply with Qualifying Questions

```typescript
import { generateAutoReply } from '@/lib/claude';

const response = await generateAutoReply({
  from: 'client@example.com',
  subject: 'Interested in services',
  body: 'I need help with marketing',
  context: 'First-time inquiry from website',
});

console.log('Questions:', response.data.questions);
console.log('Email:', response.data.emailTemplate);
```

### 2. Generate Customer Persona

```typescript
import { generatePersona } from '@/lib/claude';

const response = await generatePersona({
  emails: [
    {
      from: 'client@example.com',
      subject: 'Marketing help',
      body: 'We need social media marketing...',
    },
  ],
  businessDescription: 'E-commerce startup',
});

console.log('Persona:', response.data.persona);
console.log('Confidence:', response.data.confidence.score);
```

### 3. Complete Marketing Pipeline

```typescript
import { useAIPipeline } from '@/lib/claude';

function MarketingWizard() {
  const { persona, strategy, campaign, hooks, currentStep, execute } = useAIPipeline();

  const handleGenerate = async () => {
    await execute({
      emails: [...],
      businessDescription: 'E-commerce startup',
      businessGoals: 'Increase brand awareness',
      platforms: ['Instagram', 'TikTok'],
      budget: '$5,000',
      duration: '30 days',
      objective: 'Lead generation',
    });
  };

  return (
    <div>
      <p>Step: {currentStep}</p>
      {persona && <div>Persona: {persona.persona.name}</div>}
      {strategy && <div>UVP: {strategy.strategy.positioning.uvp}</div>}
      {campaign && <div>Campaign: {campaign.campaign.name}</div>}
      {hooks && <div>Hooks: {hooks.hooks.length} generated</div>}
    </div>
  );
}
```

## Common Use Cases

### Use Case 1: Auto-Reply for Email Inbox

```typescript
// Process incoming email
const autoReply = await aiClient.autoReply({
  from: incomingEmail.from,
  subject: incomingEmail.subject,
  body: incomingEmail.body,
  contactId: contact.id,
});

// Send auto-reply
await sendEmail({
  to: incomingEmail.from,
  subject: `Re: ${incomingEmail.subject}`,
  body: formatEmailTemplate(autoReply.emailTemplate),
});

// Save questions to contact record
await updateContact(contact.id, {
  qualifyingQuestions: autoReply.questions,
});
```

### Use Case 2: Onboarding Workflow

```typescript
// Step 1: Collect emails from client
const emails = await getContactEmails(contactId);

// Step 2: Generate persona
const persona = await aiClient.persona({
  emails,
  businessDescription: contact.businessDescription,
  contactId,
});

// Step 3: Generate strategy
const strategy = await aiClient.strategy({
  persona: persona.persona,
  businessGoals: contact.goals,
  budget: contact.budget,
  contactId,
});

// Step 4: Present to client
await createProposal(contactId, {
  persona,
  strategy,
});
```

### Use Case 3: Content Generation Dashboard

```typescript
function ContentDashboard({ contactId }) {
  const [persona, setPersona] = useState(null);
  const { data: hooks, execute: generateHooks } = useHooks();

  const handleGenerateContent = async () => {
    // Get persona
    const personaData = await aiClient.persona({
      emails: contactEmails,
      contactId,
    });
    setPersona(personaData.persona);

    // Generate hooks
    await generateHooks({
      persona: personaData.persona,
      business: contact.businessDescription,
      platforms: ['TikTok', 'Instagram', 'LinkedIn'],
      contactId,
    });
  };

  return (
    <div>
      <button onClick={handleGenerateContent}>Generate Content Ideas</button>
      {hooks && (
        <div>
          {hooks.hooks.map((hook, i) => (
            <div key={i}>
              <p>{hook.hook}</p>
              <span>{hook.platform} - {hook.effectiveness}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### API Key Not Found

```
Error: ANTHROPIC_API_KEY is not set
```

**Solution:** Add your API key to `.env.local`

### Rate Limit Exceeded

```
Error: Rate limit exceeded
```

**Solution:** Adjust rate limiting in `.env.local` or implement retry logic:

```typescript
import { retryWithBackoff } from '@/lib/claude/utils';

const result = await retryWithBackoff(
  () => aiClient.autoReply(params),
  3,  // retries
  1000 // delay
);
```

### JSON Parsing Failed

```
Error: Failed to parse JSON
```

**Solution:** This usually means the response wasn't in the expected format. Check your prompts and increase max_tokens if needed.

### CORS Errors

**Solution:** Ensure you're making requests from the same domain or configure CORS in Next.js config.

## Performance Tips

1. **Use Streaming** for real-time feedback:
```typescript
import { createStreamingMessage } from '@/lib/claude';
```

2. **Batch Requests** when possible:
```typescript
import { batchGenerate } from '@/lib/claude';
```

3. **Cache Results** for repeated queries:
```typescript
const cacheKey = `persona-${contactId}`;
const cached = getFromCache(cacheKey);
if (cached) return cached;
```

4. **Use Context** for multi-turn conversations:
```typescript
import { ConversationContext } from '@/lib/claude';
const context = new ConversationContext('email');
```

## Next Steps

1. Read the full [README.md](./README.md)
2. Explore [examples.tsx](./examples.tsx)
3. Check [types.ts](./types.ts) for TypeScript types
4. Review [prompts.ts](./prompts.ts) to customize system prompts

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the example components in examples.tsx
- Test endpoints with the test utilities in test.ts
