# Example Implementation: Task Manager Feature

This is a complete, real-world example showing how to build a feature using the Permanent Integration Pattern.

## Overview

We'll build a simple "Task Manager" feature that:
- Lists tasks for a client
- Creates new tasks
- Marks tasks as complete
- Demonstrates all integration patterns

---

## Step 1: Define Convex Schema

```typescript
// convex/schema.ts (add to existing schema)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables

  tasks: defineTable({
    clientId: v.id("clients"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_status", ["clientId", "status"]),
});
```

---

## Step 2: Create Convex Functions

```typescript
// convex/tasks.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateClientAccess, getValidatedClient } from "./lib/withClientFilter";

/**
 * List all tasks for a client
 */
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    // Step 1: Validate client exists and is active
    await validateClientAccess(ctx, args.clientId);

    // Step 2: Query tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return tasks;
  },
});

/**
 * Get task statistics for a client
 */
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      highPriority: tasks.filter((t) => t.priority === "high").length,
    };
  },
});

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    // Validate client with full document
    const client = await getValidatedClient(ctx, args.clientId);

    // Check if client has permission (example business logic)
    if (client.packageTier === "starter") {
      const existingTasks = await ctx.db
        .query("tasks")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();

      if (existingTasks.length >= 10) {
        throw new Error("Starter package limited to 10 tasks. Upgrade to Professional.");
      }
    }

    // Create task
    const taskId = await ctx.db.insert("tasks", {
      clientId: args.clientId,
      title: args.title,
      description: args.description,
      status: "pending",
      priority: args.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

/**
 * Update task status
 */
export const updateStatus = mutation({
  args: {
    clientId: v.id("clients"),
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);

    // Verify task belongs to client
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.clientId !== args.clientId) {
      throw new Error("Task does not belong to this client");
    }

    // Update task
    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.taskId;
  },
});

/**
 * Delete a task
 */
export const remove = mutation({
  args: {
    clientId: v.id("clients"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await validateClientAccess(ctx, args.clientId);

    // Verify task belongs to client
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.clientId !== args.clientId) {
      throw new Error("Task does not belong to this client");
    }

    await ctx.db.delete(args.taskId);
    return args.taskId;
  },
});
```

---

## Step 3: Create Feature Components

```tsx
// src/components/features/TaskManager/TaskStats.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TaskStatsProps {
  clientId: Id<"clients">;
}

export function TaskStats({ clientId }: TaskStatsProps) {
  const stats = useQuery(api.tasks.getStats, { clientId });

  if (!stats) {
    return <div className="text-slate-400">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-blue-400" />
          <span className="text-sm text-slate-400">Total</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.total}</div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span className="text-sm text-slate-400">Completed</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.completed}</div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-yellow-400" />
          <span className="text-sm text-slate-400">Pending</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.pending}</div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-sm text-slate-400">High Priority</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.highPriority}</div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/features/TaskManager/TaskList.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useState } from "react";

interface TaskListProps {
  clientId: Id<"clients">;
}

export function TaskList({ clientId }: TaskListProps) {
  const tasks = useQuery(api.tasks.list, { clientId });
  const updateStatus = useMutation(api.tasks.updateStatus);
  const removeTask = useMutation(api.tasks.remove);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStatus = async (taskId: Id<"tasks">, currentStatus: string) => {
    setLoading(taskId);
    try {
      await updateStatus({
        clientId,
        taskId,
        status: currentStatus === "pending" ? "completed" : "pending",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (taskId: Id<"tasks">) => {
    if (!confirm("Delete this task?")) return;

    setLoading(taskId);
    try {
      await removeTask({ clientId, taskId });
    } finally {
      setLoading(null);
    }
  };

  if (!tasks) {
    return <div className="text-slate-400">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No tasks yet. Create your first task above!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task._id}
          className="bg-slate-800 p-4 rounded-lg flex items-start gap-4 hover:bg-slate-750 transition-colors"
        >
          <button
            onClick={() => handleToggleStatus(task._id, task.status)}
            disabled={loading === task._id}
            className="mt-1"
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <div className="flex-1">
            <h3
              className={`font-medium ${
                task.status === "completed"
                  ? "text-slate-400 line-through"
                  : "text-white"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-slate-400 mt-1">{task.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  task.priority === "high"
                    ? "bg-red-900/50 text-red-400"
                    : task.priority === "medium"
                    ? "bg-yellow-900/50 text-yellow-400"
                    : "bg-blue-900/50 text-blue-400"
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleDelete(task._id)}
            disabled={loading === task._id}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// src/components/features/TaskManager/CreateTaskForm.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus } from "lucide-react";

interface CreateTaskFormProps {
  clientId: Id<"clients">;
}

export function CreateTaskForm({ clientId }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isOpen, setIsOpen] = useState(false);

  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTask({
        clientId,
        title,
        description: description || undefined,
        priority,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="h-5 w-5" />
        Create New Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Task Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
        >
          Create Task
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

```tsx
// src/components/features/TaskManager/TaskManager.tsx
"use client";

import { Id } from "@/convex/_generated/dataModel";
import { TaskStats } from "./TaskStats";
import { CreateTaskForm } from "./CreateTaskForm";
import { TaskList } from "./TaskList";

interface TaskManagerProps {
  clientId: Id<"clients">;
}

export function TaskManager({ clientId }: TaskManagerProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Task Manager</h1>
        <p className="text-slate-400">
          Manage tasks for your client efficiently
        </p>
      </div>

      <TaskStats clientId={clientId} />

      <CreateTaskForm clientId={clientId} />

      <TaskList clientId={clientId} />
    </div>
  );
}
```

---

## Step 4: Create Page with Wrapper

```tsx
// src/app/tasks/page.tsx
import { FeaturePageWrapper } from "@/components/features";
import { TaskManager } from "@/components/features/TaskManager/TaskManager";
import { CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <FeaturePageWrapper
      featureName="Task Manager"
      description="Select a client to manage their tasks"
      icon={<CheckSquare className="h-20 w-20 text-blue-500" />}
    >
      {(clientId) => <TaskManager clientId={clientId} />}
    </FeaturePageWrapper>
  );
}
```

---

## What This Example Demonstrates

### 1. Complete Type Safety
```typescript
// clientId flows through entire stack with type safety
Page → FeaturePageWrapper → TaskManager → TaskStats/TaskList/CreateForm
  ↓
Convex mutations/queries → Database operations
```

### 2. Proper Component Architecture
- **TaskManager**: Main orchestrator component
- **TaskStats**: Read-only statistics display
- **TaskList**: Interactive list with mutations
- **CreateTaskForm**: Form with validation

### 3. Pattern Compliance
- ✅ Uses `FeaturePageWrapper` for page
- ✅ Passes `clientId` as props (not context)
- ✅ Validates in every Convex function
- ✅ No null checks in components (guaranteed by wrapper)
- ✅ Handles loading states appropriately

### 4. Business Logic in Right Place
- Client validation: Convex layer
- Package tier checking: Convex layer
- UI interactions: React components
- State management: Convex + React hooks

### 5. Error Handling
- Convex throws meaningful errors
- UI catches and displays to user
- No silent failures

---

## Testing the Feature

### 1. No Client Selected
→ Shows `EmptyClientState` with Task Manager icon

### 2. Client Selected
→ Shows task manager with stats, form, and list

### 3. Create Task
→ Validates client, checks limits, creates task

### 4. Toggle Status
→ Verifies task ownership, updates status

### 5. Delete Task
→ Confirms ownership, removes task

---

## Key Takeaways

1. **Every component receives clientId as a prop**
2. **No component uses useClientContext directly**
3. **Convex validates client at start of every function**
4. **TypeScript guarantees correctness**
5. **Zero boilerplate for client validation**

This pattern scales to features of any complexity while maintaining perfect type safety and consistent UX.
