# Unite-Hub Development Workflows

Best practices for working with Claude Code, based on Anthropic's official guidelines.

---

## Workflow 1: Explore, Plan, Code, Commit

Best for complex features requiring research and planning.

### Steps
1. **Explore**: "Read the files related to [feature], don't write code yet"
   - Use subagents for complex exploration
   - Let Claude search git history if relevant
2. **Plan**: "Think hard and create a plan for [feature]"
   - Use "think", "think hard", "think harder", or "ultrathink" for extended thinking
   - Ask Claude to create a document with the plan
3. **Implement**: "Implement the plan"
   - Ask Claude to verify reasonableness as it goes
4. **Commit**: "Commit the changes and create a PR"

### Example
```
User: I need to add a new agent for competitor analysis
Claude: [Reads existing agents, doesn't code yet]
User: Think hard and create a plan for the competitor analysis agent
Claude: [Creates detailed plan with file structure, patterns]
User: Implement the plan
Claude: [Implements, tests, lints]
User: Commit and create PR
```

---

## Workflow 2: TDD (Test-Driven Development)

Best for features with clear input/output requirements.

### Use the slash command
```
/project:tdd [feature description]
```

### Manual Steps
1. Write tests first (input/output pairs)
2. Run tests - confirm they FAIL
3. Commit tests
4. Write code to pass tests (don't modify tests)
5. Iterate until green
6. Commit code

### Example
```
User: /project:tdd lead scoring calculation
Claude: [Writes tests for scoring logic]
Claude: [Runs tests, confirms failure]
Claude: [Commits tests]
Claude: [Implements scoring, tests pass]
Claude: [Commits implementation]
```

---

## Workflow 3: Visual Development

Best for UI work with design mocks.

### Steps
1. Give Claude a visual mock (paste screenshot, drag image, or provide path)
2. Ask Claude to implement the design
3. Have Claude take screenshots of the result (via Puppeteer MCP)
4. Iterate until match is satisfactory
5. Commit when satisfied

### Requirements
- Puppeteer MCP server installed
- Design mock available

---

## Workflow 4: API Route Development

Use the slash command:
```
/project:fix-api-route [route path]
```

### Checklist
- [ ] workspaceId validation
- [ ] `validateUserAndWorkspace()` call
- [ ] `withErrorBoundary` wrapper
- [ ] Proper error types
- [ ] Lint & typecheck pass

---

## Workflow 5: Agent Development

Use the slash command:
```
/project:new-agent [agent name and purpose]
```

### Checklist
- [ ] Follow `.claude/agent.md` patterns
- [ ] workspace_id isolation
- [ ] `callAnthropicWithRetry` for AI calls
- [ ] Audit logging
- [ ] Correct model selection
- [ ] API route added
- [ ] Reference updated

---

## Workflow 6: Database Migration

Use the slash command:
```
/project:migration [description]
```

### Checklist
- [ ] Check SCHEMA_REFERENCE.md
- [ ] SQL Pre-Flight Checklist header
- [ ] IF NOT EXISTS guards
- [ ] ENUM with pg_type check
- [ ] RLS with tenant isolation
- [ ] Manual execution in SQL Editor

---

## Multi-Claude Pattern

For complex tasks, use separate Claude sessions:

### Pattern A: Writer + Reviewer
1. Session 1: Write code
2. Session 2 (or /clear): Review the code
3. Session 3 (or /clear): Implement feedback

### Pattern B: TDD Split
1. Session 1: Write tests only
2. Session 2: Write code to pass tests

### Pattern C: Parallel Worktrees
```bash
# Create worktree
git worktree add ../unite-hub-feature-a feature-a

# Launch Claude in each
cd ../unite-hub-feature-a && claude

# Clean up when done
git worktree remove ../unite-hub-feature-a
```

---

## Headless Mode (CI/Automation)

Run Claude programmatically:
```bash
claude -p "Run lint and fix issues" --allowedTools Edit Bash

# With JSON output
claude -p "Analyze code quality" --output-format json

# Verbose for debugging
claude -p "Query" --verbose
```

### Use Cases
- Issue triage (label new GitHub issues)
- Code review automation
- Pre-commit hooks
- Migration scripts

---

## Course Correction Tools

1. **Ask for plan first**: "Make a plan before coding"
2. **Escape**: Interrupt Claude, preserve context
3. **Double Escape**: Jump back in history, edit prompt
4. **Ask to undo**: "Undo the last changes"

---

## Context Management

- Use `/clear` between tasks to reset context
- Use checklists (Markdown files) for complex multi-step work
- Reference files explicitly: "Read src/lib/agents/base-agent.ts"
- Paste URLs for Claude to fetch

---

## Slash Commands Reference

| Command | Purpose |
|---------|---------|
| `/project:fix-api-route [route]` | Fix API route issues |
| `/project:new-agent [name]` | Create new agent |
| `/project:migration [desc]` | Create DB migration |
| `/project:tdd [feature]` | TDD workflow |
| `/project:full-system-audit` | Run system audit |

---

**Reference**: [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
