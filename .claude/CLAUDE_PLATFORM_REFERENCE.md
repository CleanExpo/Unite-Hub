# Claude Developer Platform Reference

**Last Updated**: 2025-11-28
**Source**: Claude Developer Platform Documentation

---

## Latest Platform Updates (November 2025)

### November 24, 2025
- **Claude Opus 4.5** launched - most intelligent model combining maximum capability with practical performance
- **Programmatic tool calling** (beta) - call tools from within code execution
- **Tool search tool** (beta) - dynamically discover and load tools on-demand
- **Effort parameter** (beta) - control token usage by trading thoroughness vs efficiency
- **Client-side compaction** - automatic context management via summarization in SDKs

### November 19, 2025
- New documentation platform at `platform.claude.com/docs`

### November 18, 2025
- **Claude in Microsoft Foundry** - Azure customers with full Messages API support

### November 14, 2025
- **Structured outputs** (beta) - guaranteed schema conformance
  - JSON outputs for structured data
  - Strict tool use for validated inputs
  - Available: Sonnet 4.5 and Opus 4.1
  - Beta header: `structured-outputs-2025-11-13`

### October 16, 2025 - Agent Skills Launch
- **Agent Skills** (`skills-2025-10-02` beta)
- Anthropic-managed Skills: PowerPoint, Excel, Word, PDF
- Custom Skills via `/v1/skills` endpoints
- Requires code execution tool

---

## Current Claude Models

### Production Models

| Model | ID | Best For |
|-------|-----|----------|
| **Opus 4.5** | `claude-opus-4-5-20251101` | Complex specialized tasks, professional engineering, advanced agents |
| **Sonnet 4.5** | `claude-sonnet-4-5-20250929` | Complex agents, coding, highest intelligence |
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Real-time apps, high-volume processing |
| **Opus 4.1** | `claude-opus-4-1-20250805` | Enhanced Opus 4 capabilities |
| **Sonnet 4** | `claude-sonnet-4-20250514` | Extended thinking, balanced performance |
| **Opus 4** | `claude-opus-4-20250514` | Extended thinking, maximum capability |

### Deprecated/Retired Models
- Claude Sonnet 3.7 - deprecated (Oct 28, 2025)
- Claude Sonnet 3.5 - retired (Oct 28, 2025)
- Claude Opus 3 - deprecated (June 30, 2025)
- Claude 2.x, Claude 1.x - retired

---

## Claude 4.5 Prompting Best Practices

### General Principles

#### Be Explicit with Instructions
Claude 4.x models respond well to clear, explicit instructions. Being specific about your desired output enhances results. Request "above and beyond" behaviors explicitly.

**Example - Analytics Dashboard**:
```
Instead of: "Create an analytics dashboard"
Use: "Create an analytics dashboard. Include as many relevant features
     and interactions as possible. Go beyond the basics to create a
     fully-featured implementation."
```

#### Add Context to Improve Performance
Provide context or motivation behind instructions. Explain WHY a behavior is important.

**Example**:
```
"Format all code examples with syntax highlighting. This helps
developers quickly scan and understand the code structure."
```

#### Be Vigilant with Examples & Details
Claude 4.x models pay close attention to details and examples. Ensure examples align with desired behaviors.

### Long-Horizon Reasoning and State Tracking

Claude 4.5 excels at long-horizon tasks with exceptional state tracking:
- Maintains orientation across extended sessions
- Focuses on incremental progress (few things at a time)
- Works across multiple context windows
- Uses git for state tracking across sessions

### Context Awareness

Claude Sonnet 4.5 and Haiku 4.5 track their remaining context window ("token budget"):

**At conversation start**:
```xml
<budget:token_budget>200000</budget:token_budget>
```

**After each tool call**:
```xml
<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>
```

#### Multi-Context Window Workflows

1. **First context window**: Set up framework (write tests, create setup scripts)
2. **Future windows**: Iterate on todo-list
3. **Write tests in structured format**: e.g., `tests.json` for long-term iteration
4. **Create setup scripts**: e.g., `init.sh` to start servers, run tests, linters
5. **Starting fresh vs compacting**: Consider fresh context - Claude 4.5 discovers state from filesystem effectively

**Sample prompt for context management**:
```
Your context window will be automatically compacted as it approaches
its limit, allowing you to continue working indefinitely from where
you left off. Therefore, do not stop tasks early due to token budget
concerns. As you approach your token budget limit, save your current
progress and state to memory before the context window refreshes.
```

### Communication Style

Claude 4.5 models are:
- **More direct and grounded**: Fact-based progress reports
- **More conversational**: Fluent, less machine-like
- **Less verbose**: May skip detailed summaries unless prompted

### Tool Usage Patterns

Claude 4.5 follows instructions precisely. Be explicit about actions:

**For proactive action**:
```xml
<default_to_action>
By default, implement changes rather than only suggesting them.
If the user's intent is unclear, infer the most useful likely action
and proceed, using tools to discover any missing details instead of guessing.
</default_to_action>
```

**For conservative action**:
```xml
<do_not_act_before_instructions>
Do not jump into implementation or change files unless clearly
instructed. When the user's intent is ambiguous, default to providing
information, doing research, and providing recommendations.
</do_not_act_before_instructions>
```

### Parallel Tool Calling

Claude 4.x excels at parallel tool execution. Boost to ~100% success rate:

```xml
<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies
between the tool calls, make all of the independent tool calls in parallel.
Maximize use of parallel tool calls where possible to increase speed
and efficiency. However, if some tool calls depend on previous calls
to inform dependent values, do NOT call these tools in parallel.
</use_parallel_tool_calls>
```

### Controlling Output Format

1. **Tell Claude what to do** (not what NOT to do):
   - Instead of: "Do not use markdown"
   - Use: "Your response should be composed of smoothly flowing prose paragraphs"

2. **Use XML format indicators**:
   ```
   Write the prose sections in <smoothly_flowing_prose_paragraphs> tags.
   ```

3. **Match prompt style to desired output**: Formatting in prompt influences response style

**Sample prompt to minimize markdown**:
```xml
<avoid_excessive_markdown_and_bullet_points>
When writing reports, write in clear, flowing prose using complete
paragraphs and sentences. Use standard paragraph breaks for organization
and reserve markdown primarily for `inline code`, code blocks, and
simple headings. Avoid using **bold** and *italics*.

DO NOT use ordered lists or unordered lists unless presenting truly
discrete items where list format is best, or user explicitly requests it.
</avoid_excessive_markdown_and_bullet_points>
```

### Frontend Design Best Practices

```xml
<frontend_aesthetics>
Avoid "AI slop" aesthetic. Make creative, distinctive frontends.

Focus on:
- Typography: Beautiful, unique fonts. Avoid Inter, Arial, Roboto.
- Color & Theme: Cohesive aesthetic with sharp accents. Use CSS variables.
- Motion: Animations for effects and micro-interactions. CSS-only when possible.
- Backgrounds: Create atmosphere and depth, not solid colors.

Avoid:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white)
- Predictable layouts and component patterns
- Cookie-cutter design lacking context-specific character
</frontend_aesthetics>
```

### Avoid Over-Engineering

```xml
<minimize_overengineering>
Avoid over-engineering. Only make changes that are directly requested
or clearly necessary. Keep solutions simple and focused.

Don't add features, refactor code, or make "improvements" beyond what
was asked. A bug fix doesn't need surrounding code cleaned up.

Don't add error handling for scenarios that can't happen. Trust internal
code and framework guarantees. Only validate at system boundaries.

Don't create helpers or abstractions for one-time operations. Don't
design for hypothetical future requirements.
</minimize_overengineering>
```

### Code Exploration

```xml
<code_exploration>
ALWAYS read and understand relevant files before proposing code edits.
Do not speculate about code you have not inspected. If the user
references a specific file/path, you MUST open and inspect it before
explaining or proposing fixes. Be rigorous and persistent in searching
code for key facts.
</code_exploration>
```

### Thinking Sensitivity

When extended thinking is disabled, Claude Opus 4.5 is sensitive to "think" and variants. Replace with:
- "consider"
- "believe"
- "evaluate"

---

## Context Windows

### Understanding Context Window

The "context window" is Claude's "working memory":
- Total text Claude can reference when generating + new text generated
- Different from training corpus
- Larger = more complex prompts, longer conversations

**Standard**: 200,000 tokens (200K)
**Extended**: 1,000,000 tokens (1M) - Beta for tier 4 organizations

### Context Window Calculation

```
context_window = input_tokens + output_tokens (including thinking)
```

### 1M Token Context Window (Beta)

Available for Claude Sonnet 4 and 4.5. Requires beta header:

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[...],
    betas=["context-1m-2025-08-07"]
)
```

**Important**:
- Beta for usage tier 4 organizations only
- Premium pricing: 2x input, 1.5x output for requests >200K tokens
- Dedicated rate limits for long context

### Context Awareness in Claude 4.5

Claude Sonnet 4.5 and Haiku 4.5 track remaining context:

**At start**: `<budget:token_budget>200000</budget:token_budget>`
**After tools**: `<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>`

---

## Extended Thinking

### Supported Models

- Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Claude Opus 4.5 (`claude-opus-4-5-20251101`)
- Claude Opus 4.1 (`claude-opus-4-1-20250805`)
- Claude Opus 4 (`claude-opus-4-20250514`)
- Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`) - deprecated

### How Extended Thinking Works

Claude creates `thinking` blocks with internal reasoning before final response:

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw3URve..."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

### Basic Usage

```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000
    },
    messages=[{
        "role": "user",
        "content": "Are there infinite primes where n mod 4 == 3?"
    }]
)
```

### Summarized Thinking (Claude 4 Models)

Claude 4 models return **summarized** thinking (not full):
- Charged for full thinking tokens, not summary
- Billed output tokens won't match visible response
- First few lines more verbose for prompt engineering
- Preserves key ideas with minimal latency

**Note**: Claude Sonnet 3.7 continues to return full thinking output.

### Interleaved Thinking

Enables Claude to think between tool calls. Add beta header:
`interleaved-thinking-2025-05-14`

With interleaved thinking:
- `budget_tokens` can exceed `max_tokens`
- Claude reasons after receiving each tool result
- Makes more nuanced decisions on intermediate results

### Extended Thinking with Tool Use

**Important constraints**:
1. Only supports `tool_choice: {"type": "auto"}` or `{"type": "none"}`
2. Must pass `thinking` blocks back for last assistant message
3. Include complete unmodified block to maintain reasoning continuity

**Preserving thinking blocks**:
```python
# Extract and pass back thinking blocks with tool results
thinking_block = next((b for b in response.content if b.type == 'thinking'), None)
tool_use_block = next((b for b in response.content if b.type == 'tool_use'), None)

continuation = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[...],
    messages=[
        {"role": "user", "content": "Original question"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_use_block.id, "content": "..."}]}
    ]
)
```

### Thinking Budget Guidelines

| Budget | Use Case |
|--------|----------|
| 1,024 (minimum) | Simple reasoning tasks |
| 4,000-10,000 | Standard complex analysis |
| 16,000+ | Critical/complex tasks |
| 32,000+ | Use batch processing (avoid network timeouts) |

### Thinking Encryption

- `signature` field verifies thinking block authenticity
- `redacted_thinking` blocks contain encrypted content flagged by safety systems
- Redacted blocks still usable in subsequent requests

**Test redacted thinking**:
```
ANTHROPIC_MAGIC_STRING_TRIGGER_REDACTED_THINKING_46C9A13E193C177646C7398A98432ECCCE4C1253D5E2D82641AC0E52CC2876CB
```

### Thinking Block Preservation (Claude Opus 4.5+)

New default: thinking blocks from previous turns **preserved** in context.

**Benefits**:
- Cache optimization with tool use
- Token savings in multi-step workflows
- No negative intelligence impact

**Consideration**: Long conversations consume more context space.

---

## Context Editing (Beta)

Automatically manage conversation context as it grows.

### Beta Header
`context-management-2025-06-27`

### Server-Side Strategies

| Strategy | Description |
|----------|-------------|
| `clear_tool_uses_20250919` | Clears old tool results when context exceeds threshold |
| `clear_thinking_20251015` | Manages thinking blocks in extended thinking |

### Tool Result Clearing

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=4096,
    messages=[...],
    tools=[...],
    betas=["context-management-2025-06-27"],
    context_management={
        "edits": [
            {
                "type": "clear_tool_uses_20250919",
                "trigger": {"type": "input_tokens", "value": 30000},
                "keep": {"type": "tool_uses", "value": 3},
                "clear_at_least": {"type": "input_tokens", "value": 5000},
                "exclude_tools": ["web_search"]
            }
        ]
    }
)
```

**Configuration Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `trigger` | 100,000 tokens | When to activate clearing |
| `keep` | 3 tool uses | Recent tool use/result pairs to preserve |
| `clear_at_least` | None | Minimum tokens to clear each time |
| `exclude_tools` | None | Tools to never clear |
| `clear_tool_inputs` | false | Whether to clear tool call parameters |

### Thinking Block Clearing

```python
context_management={
    "edits": [
        {
            "type": "clear_thinking_20251015",
            "keep": {"type": "thinking_turns", "value": 2}
        }
    ]
}
```

**Default**: Keeps last 1 assistant turn with thinking (`keep: {type: "thinking_turns", value: 1}`)

**For cache optimization**: `"keep": "all"` preserves all thinking blocks

### Client-Side Compaction (SDK)

Available in Python and TypeScript SDKs with `tool_runner`:

```python
runner = client.beta.messages.tool_runner(
    model="claude-sonnet-4-5",
    max_tokens=4096,
    tools=[...],
    messages=[...],
    compaction_control={
        "enabled": True,
        "context_token_threshold": 100000,
        "model": "claude-haiku-4-5",  # Optional: cheaper model for summaries
    }
)
```

**How compaction works**:
1. SDK monitors token usage after each response
2. When threshold exceeded, injects summary prompt
3. Claude generates structured summary in `<summary></summary>` tags
4. Full history replaced with summary
5. Conversation continues from summary

---

## Messages API Patterns

### Basic Request

```python
message = anthropic.Anthropic().messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)
```

### Multi-Turn Conversations

API is stateless - always send full conversation history:

```python
messages=[
    {"role": "user", "content": "Hello, Claude"},
    {"role": "assistant", "content": "Hello!"},
    {"role": "user", "content": "Can you describe LLMs?"}
]
```

### Prefilling Claude's Response

Pre-fill part of response to shape output:

```python
messages=[
    {"role": "user", "content": "Latin for Ant? (A) Apoidea, (B) Rhopalocera, (C) Formicidae"},
    {"role": "assistant", "content": "The answer is ("}
]
```

### Vision (Images)

```python
# Base64-encoded
{
    "type": "image",
    "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": image_base64
    }
}

# URL-referenced
{
    "type": "image",
    "source": {
        "type": "url",
        "url": "https://example.com/image.jpg"
    }
}
```

Supported formats: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

---

## Core Capabilities

### Context & Processing

| Feature | Description | Availability |
|---------|-------------|--------------|
| **1M token context** | Extended context for large documents | API (Beta), Bedrock, Vertex, Foundry |
| **Agent Skills** | Extend capabilities with instruction folders | API (Beta), Foundry |
| **Batch processing** | Async processing at 50% cost | API, Bedrock, Vertex |
| **Citations** | Ground responses in source documents | API, Bedrock, Vertex, Foundry |
| **Context editing** | Auto-manage conversation context | API (Beta) |
| **Effort parameter** | Control token usage (Opus 4.5) | API (Beta) |
| **Extended thinking** | Step-by-step reasoning transparency | API, Bedrock, Vertex, Foundry |
| **Files API** | Upload/manage files | API (Beta), Foundry |
| **PDF support** | Process PDF text and visuals | API, Bedrock, Vertex, Foundry |

### Prompt Caching

| Type | Duration | Availability |
|------|----------|--------------|
| Standard | 5 minutes | API, Bedrock, Vertex, Foundry |
| Extended | 1 hour | API, Foundry |

**Caching with Extended Thinking**:
- Thinking blocks from previous turns removed from context (except Opus 4.5+)
- Changes to thinking parameters invalidate message cache
- System prompts and tools remain cached

---

## Available Tools

### System Tools

| Tool | Description | Availability |
|------|-------------|--------------|
| **Bash** | Execute bash commands | API, Bedrock, Vertex, Foundry |
| **Code execution** | Run Python in sandbox | API (Beta), Foundry |
| **Programmatic tool calling** | Call tools from code execution | API (Beta), Foundry |
| **Computer use** | Screenshots, mouse, keyboard | API (Beta), Bedrock, Vertex, Foundry |
| **Text editor** | Create/edit files | API, Bedrock, Vertex, Foundry |

### External Tools

| Tool | Description | Availability |
|------|-------------|--------------|
| **MCP connector** | Connect to remote MCP servers | API (Beta), Foundry |
| **Memory** | Store/retrieve across conversations | API (Beta) |
| **Tool search** | Dynamic tool discovery | API (Beta) |
| **Web fetch** | Retrieve web/PDF content | API (Beta), Foundry |
| **Web search** | Real-world data augmentation | API, Vertex, Foundry |

### Tool Versions
- `bash_20250124` - Independent from computer use
- `text_editor_20250728` - With `max_characters` parameter
- `computer_20250124` - With hold_key, mouse_down/up, scroll, triple_click, wait

---

## Beta Headers Reference

| Feature | Beta Header |
|---------|-------------|
| Agent Skills | `skills-2025-10-02` |
| Structured outputs | `structured-outputs-2025-11-13` |
| Computer use | `computer-use-2025-01-24` |
| Fine-grained tool streaming | `fine-grained-tool-streaming-2025-05-14` |
| Interleaved thinking | `interleaved-thinking-2025-05-14` |
| Context editing | `context-management-2025-06-27` |
| 1M context window | `context-1m-2025-08-07` |

---

## Official SDKs

| Language | Status |
|----------|--------|
| Python | GA |
| TypeScript | GA |
| Java | GA |
| Go | GA |
| Ruby | GA |
| PHP | Beta |
| C# | Beta |

---

## Enterprise Capabilities

### Security
- SOC II Type 2 certified
- HIPAA compliance options
- AWS Bedrock (GA), GCP Vertex AI, Microsoft Foundry

### Trust
- Jailbreak resistant with continuous monitoring
- Copyright indemnity protections
- High trust industry support

### Reliability
- Very low hallucination rates
- Accurate over long documents
- Global language support

---

## API Rate Limits

- Rate limits by usage tier (1-4)
- Input and output tokens per minute (separate limits)
- Long context rate limits for 1M token window
- 429 errors for rate limiting
- Acceleration limits on sharp usage increases

---

## Key API Changes

### Recent Changes
- `top_p` default changed from 0.999 to 0.99
- Cache control must be on parent content block
- Consecutive user/assistant messages auto-combined
- First message no longer required to be user message

### Response Features
- `request-id` header and in error body
- `anthropic-organization-id` response header
- `model_context_window_exceeded` stop reason

---

## Platform URLs

| Service | URL |
|---------|-----|
| Claude Console | `platform.claude.com` |
| Documentation | `platform.claude.com/docs` |
| API | `api.anthropic.com` |
| Help Center | `support.claude.com` |

---

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| Batch processing | 50% |
| Prompt caching (5m) | Up to 90% cost, 80% latency |
| Extended caching (1hr) | Additional savings for recurring context |
| Model selection | Haiku < Sonnet < Opus |
| Effort parameter | Token efficiency control |

---

## Implementation Flow

```
1. Scope use case → Define requirements
2. Design integration → Select capabilities, models, deployment
3. Prepare data → Clean relevant data sources
4. Develop prompts → Use Workbench, iterate
5. Implement → Set up environment, integrate systems
6. Test → Red team, A/B test
7. Deploy → Production deployment
8. Monitor → Ongoing improvements
```

---

**Reference**: [Claude Developer Platform](https://platform.claude.com/docs)
