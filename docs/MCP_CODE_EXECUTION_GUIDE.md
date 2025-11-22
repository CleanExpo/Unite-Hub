# MCP Code Execution Guide

This guide explains the enhanced MCP approach using code execution, based on [Anthropic's engineering blog](https://www.anthropic.com/engineering/mcp-and-code-execution).

## Overview

Traditional MCP clients load all tool definitions upfront and pass intermediate results through the context window. This approach has two problems:

1. **Tool definitions overload context** - Thousands of tools = hundreds of thousands of tokens
2. **Intermediate results consume tokens** - Data flows through context multiple times

The solution: **Present MCP servers as code APIs** that agents write code against.

## Token Savings

| Approach | Tokens | Savings |
|----------|--------|---------|
| Direct tool calls (all definitions loaded) | 150,000 | - |
| Code execution (progressive disclosure) | 2,000 | 98.7% |

## Architecture

```
src/lib/mcp/
├── client/
│   └── index.ts          # MCP client for code execution
├── servers/
│   ├── playwright/       # Browser automation wrapper
│   ├── sherlock-think/   # Deep analysis wrapper
│   ├── dataforseo/       # SEO intelligence wrapper
│   └── index.ts          # Server registry
├── skills/
│   ├── seo-audit.ts      # Reusable SEO workflow
│   ├── e2e-testing.ts    # Reusable testing patterns
│   └── SKILL.md          # Skill documentation
├── discovery.ts          # Tool search system
└── index.ts              # Main exports
```

## Usage Patterns

### 1. Import Only What You Need

```typescript
// Good: Import specific server
import * as playwright from '@/lib/mcp/servers/playwright';

// Good: Import specific functions
import { thinkDeep } from '@/lib/mcp/servers/sherlock-think';
import { serpGoogle, checkPosition } from '@/lib/mcp/servers/dataforseo';

// Avoid: Importing everything
import * as mcp from '@/lib/mcp';
```

### 2. Filter Data in Code

```typescript
// Bad: Return all data through context
const results = await seo.serpGoogle({ keyword });
// Model sees all 100 results

// Good: Filter in code
const results = await seo.serpGoogle({ keyword });
const topThree = results.items.slice(0, 3).map(r => ({
  title: r.title,
  url: r.url,
  rank: r.rank_absolute
}));
// Model sees only what's needed
```

### 3. Use Convenience Functions

Server wrappers include context-efficient convenience functions:

```typescript
// Instead of multiple tool calls:
// 1. serpGoogle
// 2. Filter in model
// 3. Extract rank

// Use convenience function:
const rank = await seo.checkPosition('keyword', 'example.com');
// Returns just the number (or null)
```

### 4. Use Skills for Complex Workflows

```typescript
import { fullSEOAudit } from '@/lib/mcp/skills/seo-audit';

// Instead of:
// - Fetch rankings
// - Fetch backlinks
// - Fetch competitors
// - Analyze each
// - Generate recommendations

// Use skill:
const audit = await fullSEOAudit('example.com', ['comp1.com', 'comp2.com']);
console.log(audit.score);
console.log(audit.recommendations);
```

### 5. Discover Tools Programmatically

```typescript
import { searchTools } from '@/lib/mcp/discovery';

// Find tools for a task
const screenshotTools = searchTools('screenshot');
// [{ server: 'playwright', tool: 'takeScreenshot', ... }]

// Search by category
const seoTools = searchTools('keywords');
// Returns keyword-related tools
```

## Server Wrappers

### Playwright (Browser Automation)

```typescript
import * as playwright from '@/lib/mcp/servers/playwright';

// Navigation
await playwright.navigate({ url: 'https://example.com' });

// Interaction
await playwright.click({ element: 'Submit', ref: 'button[type="submit"]' });
await playwright.type({ element: 'Email', ref: '#email', text: 'test@test.com' });

// Forms (batched)
await playwright.fillForm({
  fields: [
    { name: 'email', type: 'textbox', ref: '#email', value: 'test@test.com' },
    { name: 'password', type: 'textbox', ref: '#password', value: 'secret' }
  ]
});

// Convenience functions
await playwright.login(url, email, password);
const hasText = await playwright.hasText('Success');
const errors = await playwright.getErrors();
```

### Sherlock Think Alpha (Deep Analysis)

```typescript
import * as sherlock from '@/lib/mcp/servers/sherlock-think';

// Deep analysis with 1.84M context
const analysis = await sherlock.thinkDeep({
  prompt: 'Analyze security vulnerabilities',
  context: entireCodebase,
  system_prompt: 'You are a security expert'
});

// Structured codebase analysis
const audit = await sherlock.analyzeCodebase({
  task: 'architecture review',
  files: { 'src/auth.ts': authCode, 'src/api.ts': apiCode }
});
console.log(audit.patterns);
console.log(audit.issues);
console.log(audit.recommendations);

// Convenience functions
const critical = await sherlock.quickSecurityAudit(files);
const improvements = await sherlock.performanceAnalysis(files);
```

### DataForSEO (SEO Intelligence)

```typescript
import * as seo from '@/lib/mcp/servers/dataforseo';

// SERP
const results = await seo.serpGoogle({ keyword: 'web design', location_code: 2840 });

// Keywords
const data = await seo.keywordData({ keywords: ['seo', 'marketing'] });
const suggestions = await seo.keywordSuggestions({ keywords: ['seo'] });

// Domain analysis
const competitors = await seo.getCompetitors({ domain: 'example.com' });
const rankings = await seo.domainRankings({ domain: 'example.com' });

// Backlinks
const links = await seo.getBacklinks({ target: 'example.com', limit: 100 });

// Convenience functions (filtered in code)
const rank = await seo.checkPosition('keyword', 'example.com');
const highValue = await seo.highValueKeywords(['seed1', 'seed2']);
const gaps = await seo.keywordGap('you.com', 'competitor.com');
```

## Skills

### SEO Audit

```typescript
import { fullSEOAudit, quickSEOCheck, findKeywordOpportunities } from '@/lib/mcp/skills/seo-audit';

// Full audit with competitors
const audit = await fullSEOAudit('example.com', ['comp1.com', 'comp2.com']);
// Returns: { score, rankings, backlinks, competitors, keywordGaps, recommendations }

// Quick health check
const health = await quickSEOCheck('example.com');
// Returns: { score, topKeywords, issues }

// Keyword opportunities
const opportunities = await findKeywordOpportunities(['web design', 'seo']);
// Returns: [{ keyword, volume, competition, opportunity }]
```

### E2E Testing

```typescript
import {
  testLoginFlow,
  testFormSubmission,
  accessibilityCheck,
  performanceCheck,
  visualRegressionCheck
} from '@/lib/mcp/skills/e2e-testing';

// Login flow test
const result = await testLoginFlow({
  url: 'https://app.example.com/login',
  email: 'test@test.com',
  password: 'password123',
  successIndicator: 'Dashboard'
});
// Returns: { passed, duration, errors, screenshots }

// Accessibility audit
const a11y = await accessibilityCheck('https://example.com');
// Returns: { issues, warnings }

// Performance metrics
const perf = await performanceCheck('https://example.com');
// Returns: { loadTime, domElements, jsHeapSize, recommendations }
```

## Creating Custom Skills

1. Create a new file in `src/lib/mcp/skills/`
2. Import server wrappers
3. Combine multiple operations
4. Filter and transform data in code
5. Return only what's needed

```typescript
// src/lib/mcp/skills/my-skill.ts
import * as seo from '../servers/dataforseo';
import * as sherlock from '../servers/sherlock-think';

export async function myCustomWorkflow(domain: string) {
  // Fetch data in parallel
  const [rankings, competitors] = await Promise.all([
    seo.domainRankings({ domain }),
    seo.getCompetitors({ domain })
  ]);

  // Filter in code
  const topRankings = rankings.filter(r => r.rank <= 10);
  const topCompetitors = competitors.slice(0, 5);

  // Calculate insights
  const score = calculateScore(topRankings);

  // Return only what's needed
  return {
    score,
    topRankings: topRankings.length,
    competitors: topCompetitors.map(c => c.domain),
    recommendations: generateRecommendations(score)
  };
}
```

## Best Practices

1. **Progressive disclosure**: Load tools on-demand by reading specific wrapper files
2. **Filter in code**: Transform and filter data before returning to model
3. **Batch operations**: Use `Promise.all` for parallel API calls
4. **Use convenience functions**: Prefer functions that filter for you
5. **Create skills**: Bundle complex workflows into reusable patterns
6. **Return summaries**: Instead of raw data, return scores/counts/recommendations

## Configuration

MCP servers are configured in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chromium",
        "PLAYWRIGHT_HEADLESS": "true"
      }
    },
    "sherlock-think-alpha": {
      "command": "node",
      "args": [".claude/mcp_servers/sherlock-think/index.js"]
    },
    "dataforseo": {
      "command": "npx",
      "args": ["dataforseo-mcp-server"],
      "env": {
        "DATAFORSEO_API_LOGIN": "${DATAFORSEO_API_LOGIN}",
        "DATAFORSEO_API_PASSWORD": "${DATAFORSEO_API_PASSWORD}"
      }
    }
  }
}
```

## References

- [Anthropic Blog: MCP and Code Execution](https://www.anthropic.com/engineering/mcp-and-code-execution)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Cloudflare's "Code Mode" Findings](https://blog.cloudflare.com/mcp-code-mode)
