# Linear.app Integration Guide

**Status**: ✅ Implemented
**Workspace**: https://linear.app/unite-hub
**Version**: 1.0.0

---

## Overview

Unite-Hub now integrates with Linear.app for project and issue management. This integration allows you to:

- ✅ View all Linear projects and their progress
- ✅ List issues by project or team
- ✅ Create and update issues from Unite-Hub
- ✅ Sync Linear issues with Unite-Hub tasks
- ✅ Display real-time project status

---

## Setup Instructions

### 1. Get Your Linear API Key

1. Go to https://linear.app/unite-hub/settings/api
2. Click "Create new API key"
3. Give it a name (e.g., "Unite-Hub Integration")
4. Copy the generated API key

### 2. Add Environment Variables

Add to your `.env.local` file:

```bash
# Required
LINEAR_API_KEY=lin_api_your_actual_api_key_here
```

See `.env.linear.example` for complete configuration options.

### 3. Verify Installation

The Linear SDK should already be installed. If not, run:

```bash
npm install @linear/sdk
```

### 4. Test the Integration

Start your development server and visit:
- API Test: `http://localhost:3008/api/integrations/linear/projects`
- Component Test: Create a page that imports `LinearProjectList`

---

## API Routes

All Linear API routes are under `/api/integrations/linear/`:

### Projects

**GET** `/api/integrations/linear/projects`
- Lists all Linear projects
- Returns project details, teams, progress, dates

**GET** `/api/integrations/linear/projects/:projectId/issues`
- Gets all issues for a specific project
- Returns issue details, state, assignee, labels

### Issues

**POST** `/api/integrations/linear/issues`
- Creates a new Linear issue
- Body: `{ teamId, title, description, priority, projectId, assigneeId, labelIds, estimate, dueDate }`

**GET** `/api/integrations/linear/issues/:issueId`
- Gets details for a specific issue

**PATCH** `/api/integrations/linear/issues/:issueId`
- Updates an existing issue
- Body: Any of the create fields

**DELETE** `/api/integrations/linear/issues/:issueId`
- Deletes an issue

---

## React Components

### LinearProjectList

Display all Linear projects with progress bars and status:

```tsx
import { LinearProjectList } from '@/components/integrations/linear/LinearProjectList';

export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Linear Projects</h1>
      <LinearProjectList />
    </div>
  );
}
```

---

## Usage Examples

### Fetch Projects

```typescript
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

const linearClient = getLinearClient();
const projects = await linearClient.getProjects();
```

### Create an Issue

```typescript
const issue = await linearClient.createIssue({
  teamId: 'team-id-here',
  title: 'Implement new feature',
  description: 'Detailed description here',
  priority: 2, // 1=Urgent, 2=High, 3=Medium, 4=Low
  projectId: 'project-id-here',
});
```

### Get Team Issues

```typescript
const issues = await linearClient.getTeamIssues('team-id-here', {
  limit: 50,
  state: 'started', // 'started' | 'completed' | 'canceled'
});
```

### Update Issue Status

```typescript
await linearClient.updateIssue('issue-id-here', {
  stateId: 'state-id-for-completed',
});
```

---

## Type Definitions

### LinearProject

```typescript
interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string; // 'planned' | 'started' | 'paused' | 'completed' | 'canceled'
  progress: number; // 0-1 (0% to 100%)
  url: string;
  teams: { id: string; name: string }[];
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### LinearIssue

```typescript
interface LinearIssue {
  id: string;
  identifier: string; // e.g., "UH-123"
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string; // 'started' | 'completed' | 'canceled'
  };
  priority: number; // 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  labels: { id: string; name: string; color: string }[];
  estimate?: number; // Story points
  dueDate?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Next Steps

### Recommended Enhancements

1. **OAuth Integration** - Allow users to connect their own Linear accounts
2. ✅ **Webhook Support** - Real-time updates when issues change in Linear (IMPLEMENTED - see `docs/LINEAR_WEBHOOKS.md`)
3. **Two-way Sync** - Automatically sync Unite-Hub tasks with Linear issues
4. **Dashboard Widget** - Show Linear project status on main dashboard
5. **Bulk Operations** - Create multiple issues at once
6. **Custom Views** - Filter and sort issues by various criteria
7. **Issue Templates** - Pre-filled issue creation forms

### Files Created

```
src/
  lib/
    integrations/
      linear/
        linearClient.ts              # Main Linear SDK wrapper
  app/
    api/
      integrations/
        linear/
          projects/
            route.ts                 # List projects
            [projectId]/
              issues/
                route.ts             # Get project issues
          issues/
            route.ts                 # Create issue
            [issueId]/
              route.ts               # Get/Update/Delete issue
          webhook/
            route.ts                 # Webhook handler (real-time events)
  components/
    integrations/
      linear/
        LinearProjectList.tsx        # React component
docs/
  LINEAR_INTEGRATION.md              # This file
.env.linear.example                  # Environment template
```

---

## Troubleshooting

### "LINEAR_API_KEY is required" Error

Make sure you've added your Linear API key to `.env.local`:
```bash
LINEAR_API_KEY=lin_api_your_key_here
```

### "Module not found: @linear/sdk"

Install the Linear SDK:
```bash
npm install @linear/sdk
```

### Authentication Issues

1. Verify your API key is correct at https://linear.app/unite-hub/settings/api
2. Make sure the key has appropriate permissions
3. Check that `.env.local` is not committed to git (in `.gitignore`)

### No Projects Found

1. Visit https://linear.app/unite-hub/projects and create a project
2. Make sure your API key has access to the workspace
3. Check API logs for detailed error messages

---

## Resources

- **Linear API Docs**: https://developers.linear.app/docs/sdk/getting-started
- **Linear SDK GitHub**: https://github.com/linear/linear
- **Unite-Hub Linear Workspace**: https://linear.app/unite-hub
- **Linear API Keys**: https://linear.app/unite-hub/settings/api

---

**Last Updated**: 2026-01-27
**Integration Status**: ✅ Ready to Use
