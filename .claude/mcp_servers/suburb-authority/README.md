# MCP Suburb Authority Server

Model Context Protocol (MCP) server for querying suburb authority data from Supabase.

## Purpose

Provides Scout Agent access to the `suburb_authority_substrate` view for:
- **Geographic gap analysis**: Find suburbs with low client authority (expansion opportunities)
- **Content gap analysis**: Identify missing proof points (photos, reviews, testimonials)
- **Opportunity scoring**: Calculate opportunity potential based on authority signals

## Tools Provided

### 1. `query_suburb_authority`
Query the suburb_authority_substrate view with flexible filtering.

**Parameters**:
- `workspaceId` (required): Workspace UUID
- `minAuthorityScore` (optional): Min authority score (0-100)
- `maxAuthorityScore` (optional): Max authority score (use <50 for gaps)
- `state` (optional): AU state filter (NSW, VIC, QLD, etc.)
- `limit` (optional): Max results (default 50)

**Returns**: Array of suburb authority data with jobs, photos, reviews, authority scores.

### 2. `find_geographic_gaps`
Find geographic market gaps (low authority suburbs).

**Parameters**:
- `workspaceId` (required): Workspace UUID
- `state` (optional): AU state filter
- `limit` (optional): Max results (default 20)

**Returns**: Geographic gaps sorted by severity with opportunity scores.

### 3. `find_content_gaps`
Find content gaps (missing proof points in suburbs with jobs).

**Parameters**:
- `workspaceId` (required): Workspace UUID
- `state` (optional): AU state filter
- `limit` (optional): Max results (default 20)

**Returns**: Content gaps with missing proof types identified.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Start**:
   ```bash
   npm start  # stdio transport
   # or
   MCP_TRANSPORT=sse MCP_PORT=3009 npm start  # HTTP/SSE transport
   ```

## Integration with Claude Code

Add to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "suburb-authority": {
      "command": "node",
      "args": [".claude/mcp_servers/suburb-authority/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

## Authority Score Formula

**Authority Score** (0-100):
- Jobs completed: max 40 points (1 point per job)
- Photos: max 30 points (before/after = 2pts, completion = 1pt)
- Reviews: max 30 points (3 points per verified review)

**Lower scores = bigger gaps = higher opportunity**

## Example Usage

```typescript
// Scout Agent uses MCP to find geographic gaps
const gaps = await mcp.call('find_geographic_gaps', {
  workspaceId: '123e4567-e89b-12d3-a456-426614174000',
  state: 'NSW',
  limit: 20
});

// Returns suburbs with authority_score < 50, sorted by gap severity
```

## Database Dependencies

Requires these Supabase objects:
- `client_jobs` table (migration `20251226120000`)
- `suburb_authority_substrate` view (same migration)
- `workspaces` table (existing)
- `clients` table (existing)
