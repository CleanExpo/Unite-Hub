# Skills Framework

**Version**: 2.0.0
**Last Updated**: 2026-01-15
**Status**: Operational

---

## Overview

The Skills Framework provides reusable, modular capabilities that agents can load on-demand to accomplish specific tasks. Skills reduce context bloat by loading only what's needed, and enable knowledge sharing across agents.

### Key Concepts

**Skill**: A focused, reusable capability documented in a `.skill.md` file with YAML frontmatter.

**Priority Levels**:
- **Priority 1** (Auto-load): Critical skills loaded automatically for all agent invocations
- **Priority 2** (On-demand): Loaded when specific task types are detected
- **Priority 3** (Manual): Explicitly requested by name or workflow
- **Priority 4** (Deprecated): Old skills kept for reference, not loaded

**Skill Categories**:
- `context/` - Context loading and management
- `verification/` - Verification and quality checks
- `development/` - Development workflows
- `database/` - Database operations
- `frontend/` - Frontend patterns
- `backend/` - Backend patterns
- `ai/` - AI service patterns
- `seo/` - SEO operations

---

## Skill File Format

Every skill file must follow this structure:

```markdown
---
name: skill-name
category: context|verification|development|database|frontend|backend|ai|seo
priority: 1|2|3|4
version: 2.0.0
status: active|deprecated
dependencies: []
auto_load_for: []
compatible_agents: []
estimated_tokens: 0
---

# Skill Name

Brief description of what this skill provides.

## Purpose

Why this skill exists and when to use it.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Usage

How to apply this skill in practice.

## Examples

Concrete examples of using this skill.

## Related Skills

- Link to related skill 1
- Link to related skill 2
```

### YAML Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique skill identifier (kebab-case) |
| `category` | string | Yes | Skill category (see above) |
| `priority` | number | Yes | Loading priority (1-4) |
| `version` | string | Yes | Semantic version |
| `status` | string | Yes | `active` or `deprecated` |
| `dependencies` | array | No | Other skills this depends on |
| `auto_load_for` | array | No | Task types that auto-load this skill |
| `compatible_agents` | array | No | Agents that can use this skill |
| `estimated_tokens` | number | No | Approximate context size |

---

## Priority System

### Priority 1: Auto-Load (Critical Skills)

Loaded automatically for every agent invocation. Should be minimal and essential.

**Examples**:
- `context/workspace-isolation.skill.md` - Ensures all queries filtered by workspace_id
- `verification/pre-flight-checks.skill.md` - Validates environment before operations

**Guidelines**:
- Keep extremely concise (<200 tokens)
- Only foundational patterns
- Updated rarely
- Zero dependencies

### Priority 2: On-Demand (Task-Triggered)

Loaded automatically when specific task types are detected.

**Examples**:
- `database/rls-workflow.skill.md` - Auto-loaded for "RLS" or "migration" tasks
- `frontend/component-patterns.skill.md` - Auto-loaded for "component" or "UI" tasks
- `backend/api-patterns.skill.md` - Auto-loaded for "API" or "endpoint" tasks

**Guidelines**:
- Moderate size (<500 tokens)
- Clear trigger keywords in `auto_load_for`
- Task-specific patterns
- May have dependencies

### Priority 3: Manual (Explicit Load)

Loaded only when explicitly requested by name.

**Examples**:
- `ai/extended-thinking-strategies.skill.md` - Loaded for complex content generation
- `seo/perplexity-research.skill.md` - Loaded for SEO research tasks
- `development/git-workflow.skill.md` - Loaded for git operations

**Guidelines**:
- Any size (optimize for clarity)
- Specialized knowledge
- Referenced in agent definitions
- Can have multiple dependencies

### Priority 4: Deprecated

Old skills kept for reference, never loaded automatically.

**Examples**:
- `context/old-orchestration.skill.md` - Superseded by v2.0.0 patterns

**Guidelines**:
- Status: `deprecated`
- Include reason for deprecation
- Link to replacement skill
- Will be deleted after 90 days

---

## Skill Discovery & Loading

### Auto-Loading

The orchestrator automatically loads skills based on task analysis:

```typescript
async function loadRelevantSkills(task: string, agent: AgentDefinition): Promise<Skill[]> {
  const skills: Skill[] = [];

  // 1. Load Priority 1 (auto-load) skills
  const criticalSkills = await loadSkillsByPriority(1);
  skills.push(...criticalSkills);

  // 2. Load Priority 2 based on task keywords
  const taskKeywords = extractKeywords(task);
  const onDemandSkills = await findSkillsByKeywords(taskKeywords);
  skills.push(...onDemandSkills);

  // 3. Load agent-specific skills
  const agentSkills = await loadAgentSkills(agent.id);
  skills.push(...agentSkills);

  // 4. Resolve dependencies
  const allSkills = await resolveDependencies(skills);

  return allSkills;
}
```

### Manual Loading

Agents can explicitly request skills:

```typescript
// In agent definition
const skills = [
  'ai/extended-thinking-strategies.skill.md',
  'verification/verification-first.skill.md',
];

for (const skillPath of skills) {
  await loadSkill(skillPath);
}
```

### Hot Reload

Skills can be updated and reloaded without restarting:

```bash
# Modify skill file
vim .claude/skills/context/workspace-isolation.skill.md

# Skills reload automatically on next agent invocation
# No restart required
```

---

## Skill Categories

### Context Skills (`context/`)

**Purpose**: Manage context loading, optimization, and Australian localization

**Examples**:
- `workspace-isolation.skill.md` - Workspace filtering patterns
- `orchestration.skill.md` - Orchestration patterns (Plan → Parallelize → Integrate)
- `australian-context.skill.md` - en-AU localization, DD/MM/YYYY dates, AUD currency

**Priority**: Mostly Priority 1 (auto-load)

### Verification Skills (`verification/`)

**Purpose**: Quality checks, testing strategies, verification patterns

**Examples**:
- `verification-first.skill.md` - Independent verification system
- `pre-flight-checks.skill.md` - Pre-flight validation
- `testing-strategies.skill.md` - Unit, integration, E2E patterns

**Priority**: Priority 1-2

### Development Skills (`development/`)

**Purpose**: Development workflows, git operations, deployment

**Examples**:
- `git-workflow.skill.md` - Branching, commits, PRs
- `deployment-workflow.skill.md` - Blue-green deployments
- `code-review-checklist.skill.md` - Review criteria

**Priority**: Priority 2-3

### Database Skills (`database/`)

**Purpose**: Database operations, migrations, RLS policies

**Examples**:
- `rls-workflow.skill.md` - RLS migration patterns (MANDATORY for RLS work)
- `migration-patterns.skill.md` - Idempotent migration patterns
- `schema-best-practices.skill.md` - Schema design patterns

**Priority**: Priority 2 (auto-load for database keywords)

### Frontend Skills (`frontend/`)

**Purpose**: React patterns, Next.js patterns, UI components

**Examples**:
- `component-patterns.skill.md` - React 19 RSC patterns
- `nextjs-app-router.skill.md` - App Router patterns
- `shadcn-ui-integration.skill.md` - Component library usage

**Priority**: Priority 2 (auto-load for frontend keywords)

### Backend Skills (`backend/`)

**Purpose**: API development, authentication, integrations

**Examples**:
- `api-patterns.skill.md` - Next.js API route patterns
- `authentication-patterns.skill.md` - PKCE auth, JWT validation
- `integration-patterns.skill.md` - Third-party API patterns

**Priority**: Priority 2 (auto-load for backend keywords)

### AI Skills (`ai/`)

**Purpose**: AI service usage, prompt engineering, Extended Thinking

**Examples**:
- `extended-thinking-strategies.skill.md` - When/how to use Extended Thinking
- `prompt-caching.skill.md` - 90% cost savings patterns
- `rate-limiting.skill.md` - Retry with exponential backoff

**Priority**: Priority 2-3

### SEO Skills (`seo/`)

**Purpose**: SEO research, optimization, schema markup

**Examples**:
- `perplexity-research.skill.md` - Using Perplexity Sonar
- `keyword-analysis.skill.md` - Keyword research patterns
- `schema-generation.skill.md` - Schema markup patterns

**Priority**: Priority 3 (manual load for SEO tasks)

---

## Skill Dependencies

Skills can depend on other skills:

```yaml
---
name: advanced-orchestration
category: context
priority: 2
dependencies:
  - context/orchestration.skill.md
  - verification/verification-first.skill.md
---
```

**Dependency Resolution**:
1. Load requested skill
2. Recursively load all dependencies
3. De-duplicate (load each skill once)
4. Order by Priority (1 first, then 2, then 3)

**Circular Dependencies**: Not allowed. System will error if detected.

---

## Creating New Skills

### Step 1: Choose Category & Priority

Determine where the skill fits and who should use it:

- **Auto-load (Priority 1)**: Only if absolutely critical for ALL agents
- **On-demand (Priority 2)**: If specific task types need it
- **Manual (Priority 3)**: If specialized or rarely used

### Step 2: Create File

```bash
# Create skill file
touch .claude/skills/category/skill-name.skill.md
```

### Step 3: Write Content

Use the template format above. Be concise and practical.

### Step 4: Add YAML Frontmatter

```yaml
---
name: skill-name
category: context
priority: 2
version: 1.0.0
status: active
auto_load_for:
  - keyword1
  - keyword2
compatible_agents:
  - orchestrator
  - email-agent
estimated_tokens: 300
---
```

### Step 5: Test

```bash
# Trigger task with keywords
npm run orchestrator -- "Test task with keyword1"

# Verify skill loaded in logs
```

### Step 6: Update Index

Add entry to `.claude/skills/INDEX.md` (if it exists).

---

## Skill Lifecycle

### Active Skills

```yaml
status: active
```

Skills actively used and maintained. Keep up to date.

### Deprecated Skills

```yaml
status: deprecated
```

Old skills superseded by newer versions. Kept for 90 days then deleted.

### Archiving

After 90 days, deprecated skills move to `archived/skills/` and are no longer accessible.

---

## Best Practices

### 1. Single Responsibility

Each skill should do ONE thing well. If a skill grows >1000 tokens, split it.

### 2. Clear Trigger Keywords

For Priority 2 skills, choose obvious keywords:

```yaml
auto_load_for:
  - rls
  - row level security
  - migration
  - policy
```

### 3. Practical Examples

Always include 2-3 concrete examples showing actual usage.

### 4. Keep Updated

Skills should reflect current patterns. Update when architecture changes.

### 5. Version Properly

Use semantic versioning:
- `1.0.0` → `1.0.1` - Minor fixes
- `1.0.0` → `1.1.0` - New capabilities
- `1.0.0` → `2.0.0` - Breaking changes

### 6. Test Dependencies

If skill A depends on B, test that B loads correctly.

### 7. Optimize Token Count

Priority 1 skills MUST be <200 tokens. Use `estimated_tokens` to track.

---

## Skill Index

**Location**: `.claude/skills/INDEX.md` (to be created)

Provides quick overview of all skills:

```markdown
# Skill Index

## Context (5 skills)
- orchestration.skill.md (Priority 1)
- workspace-isolation.skill.md (Priority 1)
- australian-context.skill.md (Priority 2)
...

## Verification (3 skills)
...
```

---

## Performance Considerations

### Token Usage

**Before Skills Framework**:
- All documentation loaded: 1,890 lines (~127KB)
- Every agent interaction: Full context

**After Skills Framework**:
- Core: 394 lines (~27KB)
- Priority 1 skills: ~600 tokens (~4KB)
- Priority 2 skills: ~1,500 tokens (~10KB) per task
- Total typical load: ~41KB (67% reduction)

### Loading Time

- Skills load in <50ms (from local filesystem)
- No network calls
- Cached in memory after first load
- Hot reload supported

---

## Migration from Monolithic Docs

### Before (Monolithic)

All patterns in CLAUDE.md:

```markdown
# CLAUDE.md (1,255 lines)

## Authentication Pattern
...

## Database Pattern
...

## Frontend Pattern
...

## Backend Pattern
...
```

### After (Modular Skills)

Patterns split into skills:

```
.claude/skills/
├── backend/api-patterns.skill.md
├── database/rls-workflow.skill.md
├── frontend/component-patterns.skill.md
└── verification/verification-first.skill.md
```

Agents load only what they need!

---

## Future Enhancements

### Version 2.1 (Planned)

- **Skill Metrics**: Track which skills are most used
- **Skill Recommendations**: Suggest skills based on task
- **Skill Composition**: Combine multiple skills into "skill bundles"
- **Skill Marketplace**: Share skills across projects

### Version 2.2 (Future)

- **Dynamic Skill Generation**: AI generates skills from examples
- **Skill Optimization**: AI optimizes token usage
- **Skill Testing**: Automated verification of skill validity

---

## Troubleshooting

### Skill Not Loading

**Problem**: Expected skill didn't load for task

**Solution**:
1. Check `auto_load_for` keywords in YAML frontmatter
2. Verify skill status is `active`
3. Check priority is 1 or 2 for auto-load
4. Ensure file exists in `.claude/skills/`

### Circular Dependency Error

**Problem**: `Error: Circular dependency detected`

**Solution**:
1. Review `dependencies` in skill frontmatter
2. Remove circular references
3. Restructure skills to remove cycles

### Token Limit Exceeded

**Problem**: Too many skills loaded, context overflow

**Solution**:
1. Review Priority 1 skills - should be <200 tokens each
2. Split large skills into smaller focused skills
3. Move infrequently used content to Priority 3

---

**Skills Framework enables 67% context reduction while maintaining full capabilities.**
**Version**: 2.0.0 | **Status**: Operational
