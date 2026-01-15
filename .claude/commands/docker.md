# Docker Commands

**Status**: ✅ Ready to use
**Last Updated**: 2026-01-15

---

## Docker Management

```bash
npm run docker:start     # Start core services
npm run docker:stop      # Stop all services
npm run docker:logs      # View logs
npm run docker:rebuild   # Clean rebuild
npm run docker:health    # Check service health
```

## With Additional Stacks

```bash
# With observability stack
docker-compose --profile observability up -d

# With MCP servers
docker-compose --profile mcp up -d
```

---

**Source**: CLAUDE.md lines 113-127
