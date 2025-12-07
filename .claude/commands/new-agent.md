Create a new agent: $ARGUMENTS

Follow these steps:

1. Read `.claude/agent.md` for canonical patterns
2. Read `src/lib/agents/CLAUDE.md` for implementation guide
3. Read `src/lib/agents/base-agent.ts` for base class
4. Create new agent file in `src/lib/agents/[agent-name].ts`
5. Implement with these requirements:
   - Extend BaseAgent or follow functional pattern
   - workspace_id isolation
   - `callAnthropicWithRetry` for AI calls
   - Audit logging with `createAuditLog`
   - Proper model selection (Opus/Sonnet/Haiku)
6. Add API route in `src/app/api/agents/[agent-name]/route.ts`
7. Run `npm run lint && npm run typecheck`
8. Update `.claude/AGENT_REFERENCE.md` with new agent
9. Create commit with descriptive message

Model selection guide:
- Complex reasoning: claude-opus-4-5-20251101
- Standard ops: claude-sonnet-4-5-20250929
- Quick tasks: claude-haiku-4-5-20251001
