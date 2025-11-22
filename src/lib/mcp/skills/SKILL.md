# MCP Skills

This directory contains reusable code patterns for common MCP workflows. Skills execute in code to minimize context token usage.

## Available Skills

### SEO Audit (`seo-audit.ts`)

Comprehensive SEO analysis combining DataForSEO data.

```typescript
import { fullSEOAudit, quickSEOCheck, findKeywordOpportunities } from '@/lib/mcp/skills/seo-audit';

// Full audit
const audit = await fullSEOAudit('example.com', ['competitor1.com', 'competitor2.com']);
console.log(audit.score);
console.log(audit.recommendations);

// Quick check
const check = await quickSEOCheck('example.com');
console.log(check.issues);

// Find opportunities
const opportunities = await findKeywordOpportunities(['web design', 'seo services']);
```

### E2E Testing (`e2e-testing.ts`)

Browser automation patterns for testing.

```typescript
import {
  testLoginFlow,
  testFormSubmission,
  accessibilityCheck,
  performanceCheck
} from '@/lib/mcp/skills/e2e-testing';

// Test login
const loginResult = await testLoginFlow({
  url: 'https://app.example.com/login',
  email: 'test@example.com',
  password: 'testpass123',
  successIndicator: 'Dashboard'
});

// Accessibility
const a11y = await accessibilityCheck('https://example.com');
console.log(a11y.issues);

// Performance
const perf = await performanceCheck('https://example.com');
console.log(perf.loadTime);
```

## Creating New Skills

1. Create a new `.ts` file in this directory
2. Import the MCP server wrappers you need
3. Create functions that combine multiple tool calls
4. Filter and transform data in code before returning
5. Add JSDoc with examples

### Best Practices

- **Filter in code**: Don't return raw API responses. Filter to only what's needed.
- **Batch operations**: Use `Promise.all` for parallel API calls.
- **Score and rank**: Add calculated fields like scores and priorities.
- **Limit results**: Return top N instead of all results.
- **Add recommendations**: Generate actionable insights from data.

### Example Skill Template

```typescript
/**
 * My Custom Skill
 *
 * @example
 * import { myFunction } from '@/lib/mcp/skills/my-skill';
 * const result = await myFunction({ param: 'value' });
 */

import * as server from '../servers/my-server';

export interface MyResult {
  score: number;
  items: string[];
  recommendations: string[];
}

export async function myFunction(input: { param: string }): Promise<MyResult> {
  // Fetch data
  const raw = await server.getData(input);

  // Filter in code
  const filtered = raw.filter(item => item.relevant);

  // Calculate score
  const score = calculateScore(filtered);

  // Generate recommendations
  const recommendations = generateRecommendations(filtered);

  // Return only what's needed
  return {
    score,
    items: filtered.map(i => i.name).slice(0, 10),
    recommendations
  };
}
```

## Context Efficiency

Skills reduce context token usage by:

1. **Progressive disclosure**: Load only needed tool definitions
2. **Code filtering**: Filter large datasets before returning to model
3. **Batched calls**: Multiple API calls in single code execution
4. **Calculated insights**: Return scores/recommendations instead of raw data

A typical skill can reduce context usage by 80-95% compared to direct tool calls.
