# 🧠 Sherlock Think Alpha Integration

**Model**: `openrouter/sherlock-think-alpha`
**Context Window**: 1,840,000 tokens (9.2x larger than Claude Sonnet 4.5)
**Provider**: OpenRouter
**Status**: ✅ Fully Integrated

---

## Overview

Sherlock Think Alpha is integrated alongside Claude Sonnet 4.5 to provide:
- **Massive context window** for analyzing entire codebases
- **Deep reasoning** for complex architectural decisions
- **Cost-effective large-scale analysis** (~$1/MTok input vs Claude's $3/MTok)

The system intelligently routes tasks between Claude and Sherlock based on context size and task requirements.

---

## Quick Start

### 1. Get OpenRouter API Key

1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up/login
3. Navigate to Keys → Create New Key
4. Copy your key (starts with `sk-or-...`)

### 2. Add to Environment

```bash
# Add to .env.local
OPENROUTER_API_KEY=sk-or-your-key-here
```

### 3. Test Integration

```bash
node scripts/test-sherlock-think.mjs
```

You should see:
```
✅ Sherlock Think Alpha Response:
------------------------------------------------------------
[Analysis from Sherlock Think Alpha]
------------------------------------------------------------
```

---

## Architecture

### Three Integration Methods

#### 1. **MCP Server** (Use in Claude Code Terminal)

Claude Code can directly call Sherlock Think Alpha as a tool:

```typescript
// Available MCP tools:
- think_deep(prompt, context, system_prompt?, max_tokens?)
- analyze_codebase(task, files, focus_areas?)
```

**Activation**: MCP server auto-starts when you use Claude Code. Check `.claude/mcp.json`.

**Usage in Claude Code**:
```
User: "Use Sherlock Think Alpha to analyze the entire src/ directory for security issues"

Claude: [Automatically calls mcp__sherlock-think-alpha__analyze_codebase tool]
```

#### 2. **Multi-Model Orchestrator** (Auto-Routing)

The orchestrator automatically routes tasks to the best model:

```typescript
import { getOrchestrator } from "@/lib/agents/multi-model-orchestrator";

const orchestrator = getOrchestrator();

// Auto-routes based on context size and task type
const result = await orchestrator.route(
  "Analyze this codebase for security vulnerabilities",
  largeCodebaseContent
);

console.log(`Routed to: ${result.model}`); // "sherlock-think-alpha" or "claude-sonnet-4-5"
```

**Routing Logic**:
- **Context > 150k tokens** → Sherlock
- **Task includes "analyze", "audit", "review entire"** → Sherlock
- **Task includes "edit", "create", "fix"** → Claude (needs tool use)
- **Everything else** → Claude

#### 3. **Direct OpenRouter Client** (Manual Control)

For fine-grained control:

```typescript
import { getOpenRouterClient } from "@/lib/openrouter";

const client = getOpenRouterClient();

// Simple query
const response = await client.thinkDeep(
  "What are the architectural patterns in this codebase?",
  fullCodebaseContent,
  {
    maxTokens: 16000,
    temperature: 0.5,
    systemPrompt: "You are an expert software architect..."
  }
);

// Structured analysis
const analysis = await client.analyzeCodebase(
  "Security audit",
  { "src/file1.ts": content1, "src/file2.ts": content2 },
  { focusAreas: ["SQL injection", "XSS", "CSRF"] }
);

console.log(analysis.patterns);
console.log(analysis.issues);
console.log(analysis.recommendations);
```

---

## Use Cases

### ✅ When to Use Sherlock Think Alpha

1. **Full Codebase Analysis**
   - Security audits across 100+ files
   - Architecture reviews of entire projects
   - Performance optimization across modules
   - Code quality assessments

2. **Large Context Requirements**
   - Tasks needing > 150k tokens of context
   - Multi-file refactoring planning
   - Cross-cutting concern analysis

3. **Deep Reasoning**
   - Complex architectural decisions
   - Trade-off analysis with full context
   - Long-form explanations with examples

### ❌ When to Use Claude Sonnet 4.5

1. **Code Generation & Editing**
   - Creating new files
   - Editing existing code
   - Using tools (file operations, bash, etc.)

2. **Quick Tasks**
   - Single-file operations
   - Simple questions
   - Fast iterations

3. **Tool Use Required**
   - Claude has access to file editing, bash, etc.
   - Sherlock is analysis-only (no tools)

---

## Cost Comparison

### Claude Sonnet 4.5
- **Input**: $3/MTok
- **Output**: $15/MTok
- **Context**: 200k tokens
- **Best for**: Code generation, tool use

### Sherlock Think Alpha (via OpenRouter)
- **Input**: ~$1/MTok (approximate)
- **Output**: ~$5/MTok (approximate)
- **Context**: 1.84M tokens
- **Best for**: Large-scale analysis

### Example Cost Calculation

**Scenario**: Analyze entire Unite-Hub codebase (~500k tokens)

| Model | Tokens | Cost |
|-------|---------|------|
| **Claude** | Can't fit (200k limit) | Would need chunking |
| **Sherlock** | 500k input + 16k output | **$0.58** |

**Savings**: Sherlock can analyze in one pass vs multiple Claude calls.

---

## Collaborative Reasoning Pattern

The orchestrator supports a two-phase approach:

```typescript
const orchestrator = getOrchestrator();

// Phase 1: Sherlock analyzes entire codebase
// Phase 2: Claude implements based on analysis
const { analysis, implementation, totalCost } = await orchestrator.collaborate(
  "Refactor authentication system for better security",
  codebaseFiles
);

console.log("Analysis from Sherlock:", analysis.response);
console.log("Implementation from Claude:", implementation.response);
console.log("Total cost:", totalCost);
```

**Benefits**:
- Sherlock sees full context (1.84M tokens)
- Claude gets concise analysis + relevant files
- Combined cost often lower than multiple Claude calls

---

## API Reference

### OpenRouterClient

```typescript
class OpenRouterClient {
  // Simple deep thinking query
  async thinkDeep(
    prompt: string,
    context: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string>

  // Structured codebase analysis
  async analyzeCodebase(
    task: string,
    files: Record<string, string>,
    options?: {
      maxTokens?: number;
      focusAreas?: string[];
    }
  ): Promise<{
    analysis: string;
    recommendations: string[];
    patterns: string[];
    issues: string[];
  }>

  // Check availability
  isAvailable(): boolean

  // Get context window size
  getContextWindow(): number  // Returns 1,840,000
}
```

### MultiModelOrchestrator

```typescript
class MultiModelOrchestrator {
  // Auto-route to best model
  async route(
    task: string,
    context: string,
    options?: {
      forceModel?: "claude" | "sherlock";
      requiresTools?: boolean;
      requiresDeepThinking?: boolean;
    }
  ): Promise<OrchestrationResult>

  // Collaborative two-phase reasoning
  async collaborate(
    task: string,
    codebaseFiles: Record<string, string>
  ): Promise<{
    analysis: OrchestrationResult;
    implementation: OrchestrationResult;
    totalCost: number;
  }>

  // Load entire codebase
  async loadCodebase(
    patterns?: string[]
  ): Promise<Record<string, string>>
}
```

---

## CLI Scripts

### Test Integration

```bash
node scripts/test-sherlock-think.mjs
```

Tests:
1. ✅ OpenRouter client connectivity
2. ✅ Codebase analysis functionality
3. ✅ Multi-model orchestrator routing

### Analyze Codebase

```bash
# Create a script
node -e "
import { getOpenRouterClient } from './src/lib/openrouter.js';
import { glob } from 'glob';
import { readFile } from 'fs/promises';

const files = {};
for (const file of await glob('src/**/*.ts')) {
  files[file] = await readFile(file, 'utf-8');
}

const client = getOpenRouterClient();
const analysis = await client.analyzeCodebase(
  'Security audit focusing on authentication and data validation',
  files,
  { focusAreas: ['SQL injection', 'XSS', 'authentication'] }
);

console.log(JSON.stringify(analysis, null, 2));
"
```

---

## MCP Tools (Available in Claude Code)

Once the MCP server is running, Claude Code has access to:

### `think_deep`
**Description**: Deep analysis with 1.84M context window
**Parameters**:
- `prompt` (string): The analysis task
- `context` (string): Large context to analyze
- `system_prompt` (string, optional): System instructions
- `max_tokens` (number, optional): Max output tokens (default: 16000)

**Example**:
```
User: "Use think_deep to analyze all authentication code in src/lib/"

Claude: [Calls MCP tool automatically]
```

### `analyze_codebase`
**Description**: Structured analysis with patterns, issues, recommendations
**Parameters**:
- `task` (string): What to analyze
- `files` (object): File paths → content mapping
- `focus_areas` (array, optional): Specific areas to focus on

**Example**:
```
User: "Analyze the entire API layer for security issues"

Claude: [Calls MCP tool with all API files]
```

---

## Troubleshooting

### "OPENROUTER_API_KEY not set"
**Solution**: Add `OPENROUTER_API_KEY=sk-or-...` to `.env.local`

### "OpenRouter API error: 401"
**Solution**: Check your API key is valid at openrouter.ai/keys

### "Model not available"
**Solution**: Sherlock Think Alpha might be temporarily unavailable. The system will fall back to Claude automatically.

### MCP server not starting
**Solution**:
1. Check `.claude/mcp.json` has `sherlock-think-alpha` entry
2. Run `cd .claude/mcp_servers/sherlock-think && npm install`
3. Restart Claude Code

---

## Performance Tips

### 1. Use for Large Analysis Only
Don't use Sherlock for small tasks - Claude is faster and has tool access.

### 2. Batch File Analysis
Instead of multiple calls, load all files once:
```typescript
const files = await orchestrator.loadCodebase(["src/**/*.ts"]);
const analysis = await client.analyzeCodebase("Full audit", files);
```

### 3. Focus Areas
Narrow analysis scope for faster, more relevant results:
```typescript
await client.analyzeCodebase("Security audit", files, {
  focusAreas: ["authentication", "authorization", "data validation"]
});
```

---

## Roadmap

### Future Enhancements

- [ ] **Streaming responses** for long analyses
- [ ] **Caching** for repeated codebase analysis
- [ ] **Diff-based analysis** (only analyze changed files)
- [ ] **Multi-model consensus** (Claude + Sherlock both analyze, compare results)
- [ ] **Cost optimization** (auto-select model based on budget)

---

## FAQ

**Q: Can Sherlock edit files?**
A: No, Sherlock is analysis-only. Use collaborative mode: Sherlock analyzes → Claude implements.

**Q: What's the actual cost?**
A: OpenRouter pricing varies. Check [openrouter.ai/models](https://openrouter.ai/models) for current rates.

**Q: Can I use other OpenRouter models?**
A: Yes! Update `src/lib/openrouter.ts` to support other models like GPT-4 Turbo, Gemini Pro, etc.

**Q: Does this work offline?**
A: No, requires internet for OpenRouter API. Consider local models (Ollama, vLLM) for offline use.

---

## Support

**Issues**: Create GitHub issue
**Questions**: Check `scripts/test-sherlock-think.mjs` for examples
**OpenRouter Docs**: [https://openrouter.ai/docs](https://openrouter.ai/docs)

---

**🎉 You now have a 1.84M context thinking model integrated with Claude!**

Use it for large-scale analysis, let Claude handle implementation. Best of both worlds! 🚀
