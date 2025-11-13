# Social Templates Integration Guide

## Quick Start

### 1. Access the Template Library

Navigate to the templates page:
```
/dashboard/content/templates
```

### 2. Load Pre-Built Templates

Click "Load Pre-Built Templates" to add 250+ professionally written templates across all platforms.

### 3. Generate Custom Templates

Use the "AI Generate" button to create platform-specific templates using Claude AI.

## Frontend Integration

### Using the Template Library Component

```tsx
import { TemplateLibrary } from "@/components/social-templates/TemplateLibrary";

export default function TemplatesPage() {
  const clientId = "your-client-id";

  return (
    <div className="container">
      <TemplateLibrary clientId={clientId} />
    </div>
  );
}
```

### Custom Template Card

```tsx
import { TemplateCard } from "@/components/social-templates/TemplateCard";

function MyCustomComponent() {
  const template = {
    _id: "template-id",
    templateName: "Product Launch",
    copyText: "Introducing our latest innovation...",
    platform: "instagram",
    category: "promotional",
    hashtags: ["product", "launch", "new"],
    emojiSuggestions: ["🎉", "✨", "🚀"],
    characterCount: 150,
    isFavorite: false,
    usageCount: 5,
    performancePrediction: {
      estimatedReach: "2,000-4,000",
      estimatedEngagement: "8-12%",
      bestTimeToPost: "11 AM-1 PM",
    },
    tags: ["launch", "product"],
  };

  return (
    <TemplateCard
      template={template}
      onFavorite={(id) => console.log("Favorited:", id)}
      onEdit={(t) => console.log("Edit:", t)}
      onDelete={(id) => console.log("Delete:", id)}
      onCopy={(text) => console.log("Copied:", text)}
      onViewVariations={(t) => console.log("Variations:", t)}
    />
  );
}
```

### Platform Preview

```tsx
import { CopyPreview } from "@/components/social-templates/CopyPreview";

function PreviewExample() {
  return (
    <CopyPreview
      platform="instagram"
      copyText="Check out our new product! It's amazing!"
      hashtags={["product", "new", "amazing"]}
      emojis={["✨", "🎉"]}
      businessName="Your Business"
    />
  );
}
```

## Backend Integration

### Fetch Templates

```typescript
// Get all templates for a client
const response = await fetch(`/api/clients/${clientId}/social-templates`);
const data = await response.json();
console.log(data.templates);

// With filters
const response = await fetch(
  `/api/clients/${clientId}/social-templates?platform=instagram&category=promotional`
);
```

### Generate Templates with AI

```typescript
const response = await fetch("/api/social-templates/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client-id",
    platform: "instagram",
    category: "promotional",
    count: 10,
    businessContext: "E-commerce fashion brand for millennials",
  }),
});

const data = await response.json();
console.log(data.templates);
```

### Create Custom Template

```typescript
const response = await fetch("/api/social-templates/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client-id",
    platform: "linkedin",
    category: "educational",
    count: 5,
    businessContext: `
      Company: B2B SaaS startup
      Target: CTOs and Engineering Managers
      Product: Developer productivity tools
      Voice: Professional but approachable
    `,
  }),
});
```

### Generate Tone Variations

```typescript
const response = await fetch(`/api/social-templates/${templateId}/variations`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tones: ["professional", "casual", "inspirational", "humorous"],
    count: 4,
  }),
});

const data = await response.json();
console.log(data.variations);
```

### Search Templates

```typescript
const query = "product launch";
const response = await fetch(
  `/api/social-templates/search?clientId=${clientId}&query=${encodeURIComponent(query)}`
);

const data = await response.json();
console.log(data.templates);
```

### Export Templates

```typescript
// Export as JSON
const response = await fetch("/api/social-templates/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client-id",
    format: "json",
    templateIds: ["id1", "id2"], // Optional: specific templates
  }),
});

const jsonData = await response.json();

// Export as CSV
const response = await fetch("/api/social-templates/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: "client-id",
    format: "csv",
  }),
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `templates-${Date.now()}.csv`;
a.click();
```

### Bulk Operations

```typescript
// Delete multiple templates
const response = await fetch("/api/social-templates/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "delete",
    templateIds: ["id1", "id2", "id3"],
  }),
});

// Favorite multiple templates
const response = await fetch("/api/social-templates/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "favorite",
    templateIds: ["id1", "id2", "id3"],
  }),
});
```

## Convex Integration

### Query Templates

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent({ clientId }: { clientId: string }) {
  const templates = useQuery(api.socialTemplates.getTemplates, {
    clientId,
    platform: "instagram",
  });

  return (
    <div>
      {templates?.map((template) => (
        <div key={template._id}>{template.templateName}</div>
      ))}
    </div>
  );
}
```

### Create Template

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateTemplateButton({ clientId }: { clientId: string }) {
  const createTemplate = useMutation(api.socialTemplates.createTemplate);

  const handleCreate = async () => {
    await createTemplate({
      clientId,
      platform: "facebook",
      category: "promotional",
      templateName: "Summer Sale",
      copyText: "Big summer sale! Get 50% off everything!",
      hashtags: ["sale", "summer", "discount"],
      emojiSuggestions: ["☀️", "🎉", "💸"],
      variations: [],
      performancePrediction: {
        estimatedReach: "1,000-2,000",
        estimatedEngagement: "5-8%",
        bestTimeToPost: "12-2 PM",
      },
      aiGenerated: false,
      tags: ["sale", "summer"],
    });
  };

  return <button onClick={handleCreate}>Create Template</button>;
}
```

### Toggle Favorite

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function FavoriteButton({ templateId }: { templateId: string }) {
  const toggleFavorite = useMutation(api.socialTemplates.toggleFavorite);

  return (
    <button onClick={() => toggleFavorite({ templateId })}>
      Toggle Favorite
    </button>
  );
}
```

## Advanced Usage

### Seeding Templates for New Client

```typescript
import { seedTemplatesForClient } from "@/lib/social-templates/seedTemplates";

async function onboardNewClient(clientId: string) {
  // Seed all pre-built templates
  const count = await seedTemplatesForClient(clientId);
  console.log(`Seeded ${count} templates for new client`);

  // Generate custom templates based on onboarding data
  const response = await fetch("/api/social-templates/generate", {
    method: "POST",
    body: JSON.stringify({
      clientId,
      platform: "instagram",
      category: "promotional",
      count: 20,
      businessContext: client.businessDescription,
    }),
  });
}
```

### Platform-Specific Workflows

#### Instagram Story Templates
```typescript
const storyTemplates = templates.filter(
  (t) => t.platform === "instagram" && t.tags.includes("story")
);
```

#### LinkedIn Thought Leadership Series
```typescript
const linkedinSeries = await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({
    clientId,
    platform: "linkedin",
    category: "educational",
    count: 10,
    businessContext: `
      Create a 10-part thought leadership series about [topic].
      Each post should build on the previous one.
      Target: Senior executives
      Tone: Professional but insightful
    `,
  }),
});
```

#### TikTok Viral Series
```typescript
const tiktokSeries = await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({
    clientId,
    platform: "tiktok",
    category: "engagement",
    count: 15,
    businessContext: `
      Create viral TikTok hooks for [product/service].
      Include trending formats and sounds.
      Target: Gen Z audience
      Tone: Fun, authentic, trendy
    `,
  }),
});
```

### Content Calendar Integration

```typescript
// Generate templates for next month's content calendar
async function populateContentCalendar(clientId: string) {
  const weeks = ["promotional", "educational", "engagement", "testimonial"];

  for (const [index, category] of weeks.entries()) {
    await fetch("/api/social-templates/generate", {
      method: "POST",
      body: JSON.stringify({
        clientId,
        platform: "instagram",
        category,
        count: 7, // One per day
        businessContext: `Week ${index + 1} focus: ${category}`,
      }),
    });
  }
}
```

### A/B Testing Setup

```typescript
// Generate variations for A/B testing
async function createABTestVariants(templateId: string) {
  const response = await fetch(`/api/social-templates/${templateId}/variations`, {
    method: "POST",
    body: JSON.stringify({
      tones: ["professional", "casual", "humorous"],
      count: 3,
    }),
  });

  const data = await response.json();

  // Use variations for A/B testing
  return data.variations.map((v: any, i: number) => ({
    variant: `Variant ${String.fromCharCode(65 + i)}`, // A, B, C
    copy: v.copy,
    tone: v.tone,
  }));
}
```

## Best Practices

### 1. Batch Generation
Generate templates in batches for efficiency:

```typescript
async function batchGenerateTemplates(clientId: string) {
  const platforms = ["facebook", "instagram", "linkedin"];
  const categories = ["promotional", "educational"];

  const promises = platforms.flatMap((platform) =>
    categories.map((category) =>
      fetch("/api/social-templates/generate", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          platform,
          category,
          count: 5,
        }),
      })
    )
  );

  await Promise.all(promises);
}
```

### 2. Template Caching
Cache frequently used templates:

```typescript
const templateCache = new Map();

async function getCachedTemplate(templateId: string) {
  if (templateCache.has(templateId)) {
    return templateCache.get(templateId);
  }

  const response = await fetch(`/api/social-templates/${templateId}`);
  const data = await response.json();

  templateCache.set(templateId, data.template);
  return data.template;
}
```

### 3. Error Handling
Always handle errors gracefully:

```typescript
async function safeGenerateTemplates(params: any) {
  try {
    const response = await fetch("/api/social-templates/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating templates:", error);
    // Fallback to pre-built templates
    return await fetch(`/api/clients/${params.clientId}/social-templates`);
  }
}
```

### 4. Rate Limiting
Respect Claude AI rate limits:

```typescript
class TemplateGenerator {
  private queue: Promise<any>[] = [];
  private maxConcurrent = 3;

  async generate(params: any) {
    while (this.queue.length >= this.maxConcurrent) {
      await Promise.race(this.queue);
    }

    const promise = this.generateTemplate(params);
    this.queue.push(promise);

    promise.finally(() => {
      this.queue = this.queue.filter((p) => p !== promise);
    });

    return promise;
  }

  private async generateTemplate(params: any) {
    // Actual generation logic
  }
}
```

## Troubleshooting

### Issue: Templates not loading
```typescript
// Debug template fetch
const response = await fetch(`/api/clients/${clientId}/social-templates`);
console.log("Response status:", response.status);
const data = await response.json();
console.log("Templates count:", data.templates?.length);
```

### Issue: AI generation failing
```typescript
// Check API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not set!");
}

// Test with smaller count
await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({
    clientId,
    platform: "facebook",
    category: "promotional",
    count: 1, // Start with 1
  }),
});
```

### Issue: Character count mismatch
```typescript
// Accurate emoji counting
function getCharacterCount(text: string): number {
  // Emojis count as 2 characters on most platforms
  const emojiRegex = /[\p{Emoji}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  return text.length + emojiCount;
}
```

## Support

- Documentation: `/docs/SOCIAL_TEMPLATES_SPEC.md`
- API Reference: `/docs/API.md`
- Examples: `/examples/social-templates`
- Issues: GitHub Issues

## Next Steps

1. Explore the template library
2. Generate your first custom templates
3. Set up A/B testing with tone variations
4. Integrate with your content calendar
5. Track performance metrics
