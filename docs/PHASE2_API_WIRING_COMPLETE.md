# Phase 2 – API Wiring Complete Guide

**Created**: 2025-11-19
**Status**: 📋 Implementation Guide
**Priority**: P1 (Required for Phase 2 Completion)
**Estimated Time**: 6-8 hours

---

## Overview

This document defines the complete API wiring strategy for Unite-Hub's Phase 2 staff and client portals. API wiring connects frontend pages to backend endpoints using a consistent service layer pattern with proper error handling, loading states, and type safety.

---

## Current Status

### ✅ Already Wired

- ✅ Staff Activity Page → `/api/staff/activity`
  - Location: `src/app/(staff)/staff/activity/page.tsx`
  - Service: `getStaffActivity()` from `src/lib/services/staff/staffService.ts`
  - Status: Fully functional with error handling

### ⚠️ Needs Wiring

**Staff Pages** (3 pages):
- ❌ `/staff/tasks` → `/api/staff/tasks`
- ❌ `/staff/projects` → `/api/staff/projects`
- ❌ `/staff` (dashboard) → Multiple endpoints (stats aggregation)

**Client Pages** (3 pages):
- ❌ `/client/ideas` → `/api/client/ideas`
- ❌ `/client/vault` → `/api/client/vault`
- ❌ `/client/assistant` → `/api/ai/interpret-idea`

---

## Architecture Pattern

### Service Layer Architecture

```
React Component (src/app/)
    ↓
Service Function (src/lib/services/)
    ↓
API Helper (src/lib/services/api.ts)
    ↓
API Route (src/app/api/)
    ↓
Supabase Database
```

**Why this pattern?**
- Separation of concerns (UI vs data fetching)
- Reusable service functions across pages
- Centralized error handling
- Type safety with TypeScript
- Easy testing and mocking

---

## Implementation Steps

### Step 1: Wire Staff Tasks Page

**File**: `src/app/(staff)/staff/tasks/page.tsx`

**Current State**: Uses placeholder data

**Target State**: Fetch from `/api/staff/tasks`

**Service Layer** (`src/lib/services/staff/staffService.ts`):

```typescript
// Add to existing file
export async function getStaffTasks(filters?: {
  myTasksOnly?: boolean;
  status?: string;
  priority?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.myTasksOnly) params.append('my_tasks_only', 'true');
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);

  const res = await fetch(`/api/staff/tasks?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }

  return res.json();
}

export async function updateTaskStatus(taskId: string, status: string) {
  const res = await fetch(`/api/staff/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update task: ${res.statusText}`);
  }

  return res.json();
}

export async function createTask(taskData: {
  project_id: string;
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
}) {
  const res = await fetch('/api/staff/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });

  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }

  return res.json();
}
```

**Page Component** (`src/app/(staff)/staff/tasks/page.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getStaffTasks, updateTaskStatus } from '@/lib/services/staff/staffService';
import { TaskCard } from '@/components/staff/TaskCard';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    myTasksOnly: true,
    status: 'all',
    priority: 'all',
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  async function loadTasks() {
    setLoading(true);
    setError(null);

    try {
      const response = await getStaffTasks({
        myTasksOnly: filters.myTasksOnly,
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
      });

      setTasks(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      loadTasks(); // Reload tasks
    } catch (err) {
      toast.error('Failed to update task');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>{error}</p>
        <button onClick={loadTasks} className="mt-4 text-blue-400 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter controls */}
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.myTasksOnly}
            onChange={(e) => setFilters({ ...filters, myTasksOnly: e.target.checked })}
          />
          <span className="ml-2">My Tasks Only</span>
        </label>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-1 rounded bg-gray-800 text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-3 py-1 rounded bg-gray-800 text-gray-100"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Task list */}
      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tasks found</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

---

### Step 2: Wire Staff Projects Page

**File**: `src/app/(staff)/staff/projects/page.tsx`

**Service Layer** (`src/lib/services/staff/staffService.ts`):

```typescript
export async function getStaffProjects(filters?: {
  status?: string;
  sortBy?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.sortBy) params.append('sort_by', filters.sortBy);

  const res = await fetch(`/api/staff/projects?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.statusText}`);
  }

  return res.json();
}
```

**Page Component** (similar pattern to tasks page):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getStaffProjects } from '@/lib/services/staff/staffService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function StaffProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const response = await getStaffProjects();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="p-6">
          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
          <p className="text-gray-400 mb-4">{project.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant={project.status === 'active' ? 'success' : 'default'}>
              {project.status}
            </Badge>
            <span className="text-sm text-gray-400">
              {project.task_count || 0} tasks
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

### Step 3: Wire Staff Dashboard Stats

**File**: `src/app/(staff)/staff/page.tsx`

**Service Layer** (`src/lib/services/staff/staffService.ts`):

```typescript
export async function getStaffDashboardStats() {
  const res = await fetch('/api/staff/me', { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${res.statusText}`);
  }

  const data = await res.json();

  // Return aggregated stats
  return {
    activeTasks: data.stats?.active_tasks || 0,
    completedTasks: data.stats?.completed_tasks || 0,
    activeProjects: data.stats?.active_projects || 0,
    recentActivity: data.recent_activity || [],
  };
}
```

**Page Component**:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getStaffDashboardStats } from '@/lib/services/staff/staffService';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getStaffDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Active Tasks</h3>
        <p className="text-3xl font-bold text-blue-400">{stats?.activeTasks || 0}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Completed Tasks</h3>
        <p className="text-3xl font-bold text-green-400">{stats?.completedTasks || 0}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
        <p className="text-3xl font-bold text-purple-400">{stats?.activeProjects || 0}</p>
      </Card>
    </div>
  );
}
```

---

### Step 4: Wire Client Ideas Page

**File**: `src/app/(client)/client/ideas/page.tsx`

**Service Layer** (create `src/lib/services/client/clientService.ts`):

```typescript
export async function getClientIdeas() {
  const res = await fetch('/api/client/ideas', { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch ideas: ${res.statusText}`);
  }

  return res.json();
}

export async function submitIdea(ideaData: {
  title: string;
  description: string;
  category?: string;
  media_url?: string;
}) {
  const res = await fetch('/api/client/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ideaData),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit idea: ${res.statusText}`);
  }

  return res.json();
}
```

**Page Component**:

```typescript
'use client';

import { useState } from 'react';
import { submitIdea } from '@/lib/services/client/clientService';
import { IdeaRecorder } from '@/components/client/IdeaRecorder';
import { toast } from '@/components/ui/Toast';

export default function ClientIdeasPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(ideaData: any) {
    setIsSubmitting(true);

    try {
      await submitIdea(ideaData);
      toast.success('Idea submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit idea');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit Your Idea</h1>
      <IdeaRecorder onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
```

---

### Step 5: Wire Client Vault Page

**File**: `src/app/(client)/client/vault/page.tsx`

**Service Layer** (`src/lib/services/client/clientService.ts`):

```typescript
export async function getVaultEntries() {
  const res = await fetch('/api/client/vault', { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch vault entries: ${res.statusText}`);
  }

  return res.json();
}

export async function createVaultEntry(entryData: {
  service_name: string;
  username?: string;
  encrypted_password: string;
  notes?: string;
}) {
  const res = await fetch('/api/client/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entryData),
  });

  if (!res.ok) {
    throw new Error(`Failed to create vault entry: ${res.statusText}`);
  }

  return res.json();
}

export async function deleteVaultEntry(entryId: string) {
  const res = await fetch(`/api/client/vault/${entryId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Failed to delete vault entry: ${res.statusText}`);
  }

  return res.json();
}
```

**Page Component** (similar CRUD pattern as tasks page)

---

## Error Handling Strategy

### API Response Format (Standard)

All API routes should return this format:

```typescript
// Success response
{
  "success": true,
  "data": [...] | {...},
  "message": "Operation completed successfully"
}

// Error response
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400 | 401 | 403 | 404 | 500
}
```

### Service Layer Error Handling

```typescript
export async function exampleServiceFunction() {
  try {
    const res = await fetch('/api/endpoint');

    if (!res.ok) {
      // Extract error message from response
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    // Re-throw with context
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Unknown error occurred'
    );
  }
}
```

### Component Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

async function fetchData() {
  setError(null);

  try {
    const data = await serviceFunction();
    // Handle success
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Operation failed';
    setError(errorMessage);
    toast.error(errorMessage);
  }
}
```

---

## Loading State Patterns

### Pattern 1: Full Page Loading

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
}
```

### Pattern 2: Skeleton Placeholders

```typescript
if (loading) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );
}
```

### Pattern 3: Inline Loading (Buttons)

```typescript
<Button loading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

---

## Form Validation Pattern

### Client-Side Validation (Zod)

```typescript
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

function handleSubmit(formData: TaskFormData) {
  try {
    const validated = taskSchema.parse(formData);
    // Submit to API
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Display validation errors
      err.errors.forEach((error) => {
        toast.error(error.message);
      });
    }
  }
}
```

---

## Testing Strategy

### Service Layer Tests

```typescript
// tests/services/staffService.test.ts
import { getStaffTasks } from '@/lib/services/staff/staffService';

describe('Staff Service', () => {
  it('should fetch tasks with filters', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: '1', title: 'Test' }] }),
      })
    );

    const result = await getStaffTasks({ myTasksOnly: true });
    expect(result.data).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('my_tasks_only=true'),
      expect.any(Object)
    );
  });
});
```

### Component Tests

```typescript
// tests/components/StaffTasksPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import StaffTasksPage from '@/app/(staff)/staff/tasks/page';

jest.mock('@/lib/services/staff/staffService', () => ({
  getStaffTasks: jest.fn(() => Promise.resolve({ data: [] })),
}));

describe('StaffTasksPage', () => {
  it('should display loading state initially', () => {
    render(<StaffTasksPage />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  it('should display tasks after loading', async () => {
    render(<StaffTasksPage />);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
```

---

## Implementation Checklist

### Staff Portal
- [ ] Wire `/staff/tasks` to `/api/staff/tasks`
- [ ] Add task filtering (my tasks, status, priority)
- [ ] Implement task status updates
- [ ] Wire `/staff/projects` to `/api/staff/projects`
- [ ] Wire `/staff` dashboard stats
- [ ] Add error handling with toast notifications
- [ ] Add loading states (Spinner + Skeleton)

### Client Portal
- [ ] Wire `/client/ideas` to `/api/client/ideas`
- [ ] Implement idea submission with media upload
- [ ] Wire `/client/vault` to `/api/client/vault`
- [ ] Add CRUD operations for vault entries
- [ ] Add form validation with Zod
- [ ] Add error handling with toast notifications

### Service Layer
- [ ] Create `src/lib/services/client/clientService.ts`
- [ ] Add all client service functions
- [ ] Standardize error handling across all services
- [ ] Add TypeScript types for all responses

### Testing
- [ ] Write unit tests for service functions
- [ ] Write component tests for wired pages
- [ ] Write integration tests for API flows
- [ ] Verify error handling works correctly

---

## Next Steps

After completing API wiring:

1. Enable client authentication (see `PHASE2_CLIENT_AUTH_IMPLEMENTATION.md`)
2. Add interactive features (see `PHASE2_INTERACTIVE_FEATURES.md`)
3. Implement comprehensive testing (see `PHASE2_TESTING_COMPLETE.md`)
4. Polish UI/UX (animations, transitions)
5. Performance optimization (caching, lazy loading)

---

**Status**: 📋 Ready for Implementation
**Estimated Time**: 6-8 hours (all pages)
**Priority**: P1 (Required for Phase 2 completion)
