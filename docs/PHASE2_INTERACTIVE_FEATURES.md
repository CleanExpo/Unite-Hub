# Phase 2 – Interactive Features Implementation Guide

**Created**: 2025-11-19
**Status**: 📋 Implementation Guide
**Priority**: P1 (Required for Production UX)
**Estimated Time**: 4-6 hours

---

## Overview

This document defines the interactive UX features required to make Unite-Hub's Phase 2 portals production-ready. Interactive features include toast notifications, form validation, loading states, logout functionality, real-time updates, and error boundaries.

---

## Current Status

### ✅ Components Available

- ✅ `Toast.tsx` - 4 variants (success, error, warning, info)
- ✅ `Spinner.tsx` - Loading spinners (3 sizes)
- ✅ `Skeleton.tsx` - Loading placeholders
- ✅ `Button.tsx` - With loading prop
- ✅ `Input.tsx` - With error states
- ✅ `Modal.tsx` - Portal rendering

### ⚠️ Needs Implementation

- ❌ Toast notification system wired to components
- ❌ Form validation with error display
- ❌ Logout functionality (staff + client)
- ❌ Real-time status updates
- ❌ Error boundary components
- ❌ Optimistic UI updates

---

## Architecture

### Toast Notification System

**Pattern**: Global toast provider with context

```
ToastProvider (Context)
    ↓
App Component Tree
    ↓
Any Component → toast.success() / toast.error()
    ↓
Toast appears in fixed position (top-right)
```

---

## Implementation Steps

### Step 1: Create Toast Context

**File**: `src/contexts/ToastContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);

    setToasts((prev) => [...prev, { id, type, message, duration }]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextType = {
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
    info: (message, duration) => addToast('info', message, duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container (fixed top-right) */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
```

---

### Step 2: Add ToastProvider to Root Layout

**File**: `src/app/layout.tsx`

```typescript
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

---

### Step 3: Use Toast in Components

**Example**: Staff Tasks Page

```typescript
'use client';

import { useToast } from '@/contexts/ToastContext';
import { updateTaskStatus } from '@/lib/services/staff/staffService';

export default function StaffTasksPage() {
  const toast = useToast();

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated successfully!');
    } catch (err) {
      toast.error('Failed to update task status. Please try again.');
    }
  }

  return (
    <div>
      {/* Task list */}
    </div>
  );
}
```

---

### Step 4: Form Validation with Error Display

**Pattern**: Use Zod for validation + display errors inline

**File**: `src/app/(client)/client/ideas/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { submitIdea } from '@/lib/services/client/clientService';

const ideaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().optional(),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

export default function ClientIdeasPage() {
  const toast = useToast();
  const [formData, setFormData] = useState<IdeaFormData>({
    title: '',
    description: '',
    category: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof IdeaFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateField(field: keyof IdeaFormData, value: string) {
    try {
      ideaSchema.pick({ [field]: true }).parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: err.errors[0].message }));
      }
    }
  }

  function handleChange(field: keyof IdeaFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Validate entire form
    try {
      const validated = ideaSchema.parse(formData);

      setIsSubmitting(true);

      await submitIdea(validated);

      toast.success('Idea submitted successfully!');

      // Reset form
      setFormData({ title: '', description: '', category: '' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof IdeaFormData, string>> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof IdeaFormData] = error.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error('Failed to submit idea. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <Input
        label="Idea Title"
        placeholder="Enter a catchy title..."
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        required
      />

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${
            errors.description ? 'border-red-500' : 'border-gray-700'
          } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
          placeholder="Describe your idea in detail..."
          rows={6}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
        />
        {errors.description && (
          <p className="text-red-400 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <Input
        label="Category (Optional)"
        placeholder="e.g., Mobile App, Web Service"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
      />

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        disabled={isSubmitting || Object.keys(errors).length > 0}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Idea'}
      </Button>
    </form>
  );
}
```

---

### Step 5: Logout Functionality

**Staff Logout** (`src/components/staff/StaffHeader.tsx`):

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/auth/supabase';

export function StaffHeader({ staff }: { staff: any }) {
  const router = useRouter();
  const toast = useToast();

  async function handleLogout() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error('Failed to logout. Please try again.');
        return;
      }

      toast.success('Logged out successfully');
      router.push('/auth/login');
      router.refresh();
    } catch (err) {
      toast.error('An error occurred during logout');
    }
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff Portal</h1>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{staff.name || staff.email}</p>
            <p className="text-xs text-gray-400">{staff.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-100 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

**Update Staff Layout** (`src/app/(staff)/staff/layout.tsx`):

```typescript
import { StaffHeader } from '@/components/staff/StaffHeader';

export default async function StaffLayout({ children }: StaffLayoutProps) {
  const session = await getStaffSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <StaffHeader staff={session.staff} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800">
          {/* Navigation */}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
```

**Client Logout** (similar pattern in `src/components/client/ClientHeader.tsx`)

---

### Step 6: Loading States

**Pattern 1**: Full-Page Spinner

```typescript
import { Spinner } from '@/components/ui/Spinner';

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
      <span className="ml-3 text-gray-400">Loading...</span>
    </div>
  );
}
```

**Pattern 2**: Skeleton Placeholders

```typescript
import { Skeleton } from '@/components/ui/Skeleton';

if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
```

**Pattern 3**: Button Loading State

```typescript
import { Button } from '@/components/ui/Button';

<Button loading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>
```

---

### Step 7: Error Boundary

**File**: `src/components/ErrorBoundary.tsx`

```typescript
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-3xl font-bold text-red-400">Something went wrong</h1>
            <p className="text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in Layout**:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {children}
      </div>
    </ErrorBoundary>
  );
}
```

---

### Step 8: Optimistic UI Updates

**Pattern**: Update UI immediately, rollback on error

```typescript
'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { updateTaskStatus } from '@/lib/services/staff/staffService';

export default function TaskCard({ task }: { task: any }) {
  const toast = useToast();
  const [localTask, setLocalTask] = useState(task);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    // Save original state for rollback
    const originalStatus = localTask.status;

    // Optimistic update
    setLocalTask({ ...localTask, status: newStatus });
    setIsUpdating(true);

    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success('Task status updated');
    } catch (err) {
      // Rollback on error
      setLocalTask({ ...localTask, status: originalStatus });
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className={`p-4 bg-gray-800 rounded-lg ${isUpdating ? 'opacity-50' : ''}`}>
      <h3>{localTask.title}</h3>

      <select
        value={localTask.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
```

---

### Step 9: Real-Time Status Updates (Optional)

**Pattern**: Use Supabase Realtime for live updates

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    loadTasks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Task changed:', payload);

          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) => (task.id === payload.new.id ? payload.new : task))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadTasks() {
    // Fetch tasks from API
  }

  return <div>{/* Task list */}</div>;
}
```

---

## Component Checklist

### Toast Notifications
- [ ] Create `ToastContext.tsx` with provider
- [ ] Add `ToastProvider` to root layout
- [ ] Use `useToast()` in all pages with API calls
- [ ] Display success/error/warning messages
- [ ] Auto-dismiss after 5 seconds

### Form Validation
- [ ] Install Zod (`npm install zod`)
- [ ] Create validation schemas for all forms
- [ ] Display inline errors for each field
- [ ] Validate on blur + submit
- [ ] Disable submit button if form invalid

### Loading States
- [ ] Add `Spinner` to full-page loading
- [ ] Add `Skeleton` to data loading
- [ ] Add `loading` prop to all submit buttons
- [ ] Disable interactive elements while loading

### Logout Functionality
- [ ] Create logout handler for staff portal
- [ ] Create logout handler for client portal
- [ ] Clear session on logout
- [ ] Redirect to login page
- [ ] Show success toast

### Error Handling
- [ ] Create `ErrorBoundary` component
- [ ] Wrap layouts with error boundary
- [ ] Display user-friendly error messages
- [ ] Provide "reload page" action

### Optimistic Updates
- [ ] Implement for task status changes
- [ ] Implement for vault entry creation
- [ ] Rollback on API failure
- [ ] Show loading state during update

---

## Testing Strategy

### Unit Tests

```typescript
// tests/contexts/ToastContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

function TestComponent() {
  const toast = useToast();

  return (
    <button onClick={() => toast.success('Test message')}>
      Show Toast
    </button>
  );
}

describe('ToastContext', () => {
  it('should display toast message', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should auto-dismiss toast after duration', async () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    button.click();

    expect(screen.getByText('Test message')).toBeInTheDocument();

    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
```

---

## Accessibility Considerations

1. **Toast Notifications**:
   - Use `role="alert"` for screen readers
   - Auto-dismiss should be configurable
   - Provide manual close button

2. **Form Validation**:
   - Associate error messages with inputs using `aria-describedby`
   - Use `aria-invalid` on invalid fields
   - Focus first invalid field on submit

3. **Loading States**:
   - Use `aria-busy="true"` during loading
   - Provide accessible loading text
   - Disable form during submission

4. **Logout Button**:
   - Use semantic button element
   - Provide clear label/title
   - Confirm before logout (optional)

---

## Next Steps

After implementing interactive features:

1. Complete API wiring (see `PHASE2_API_WIRING_COMPLETE.md`)
2. Enable client authentication (see `PHASE2_CLIENT_AUTH_IMPLEMENTATION.md`)
3. Implement comprehensive testing (see `PHASE2_TESTING_COMPLETE.md`)
4. Polish animations and transitions
5. Performance optimization

---

**Status**: 📋 Ready for Implementation
**Estimated Time**: 4-6 hours
**Priority**: P1 (Required for production UX)
