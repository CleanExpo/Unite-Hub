'use client';

/**
 * WorkspaceSwitcher Component
 * Phase 12 Week 1-2: Enterprise Mode Foundation
 *
 * Allows users to switch between their accessible workspaces
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Settings,
  Users,
} from 'lucide-react';

interface UserWorkspace {
  workspace_id: string;
  workspace_name: string;
  org_id: string;
  org_name: string;
  role_name: string;
  is_active: boolean;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  onWorkspaceChange: (workspaceId: string) => void;
  canCreateWorkspace?: boolean;
  className?: string;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  onWorkspaceChange,
  canCreateWorkspace = false,
  className,
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentWorkspace = workspaces.find(
    w => w.workspace_id === currentWorkspaceId
  );

  // Group workspaces by organization
  const workspacesByOrg = workspaces.reduce((acc, ws) => {
    if (!acc[ws.org_id]) {
      acc[ws.org_id] = {
        org_name: ws.org_name,
        workspaces: [],
      };
    }
    acc[ws.org_id].workspaces.push(ws);
    return acc;
  }, {} as Record<string, { org_name: string; workspaces: UserWorkspace[] }>);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/enterprise/workspaces');
      const data = await response.json();

      if (data.success) {
        setWorkspaces(data.data);

        // Auto-select first workspace if none selected
        if (!currentWorkspaceId && data.data.length > 0) {
          onWorkspaceChange(data.data[0].workspace_id);
        }
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !currentWorkspace) {
return;
}

    setIsCreating(true);
    try {
      const response = await fetch('/api/enterprise/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          org_id: currentWorkspace.org_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateDialogOpen(false);
        setNewWorkspaceName('');
        await loadWorkspaces();
        onWorkspaceChange(data.data.id);
      } else {
        alert(data.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'editor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" className={className} disabled>
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Button variant="outline" className={className} disabled>
        <Building2 className="mr-2 h-4 w-4" />
        No workspaces
      </Button>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate max-w-[150px]">
                {currentWorkspace?.workspace_name || 'Select workspace'}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px]">
          {Object.entries(workspacesByOrg).map(([orgId, { org_name, workspaces: orgWorkspaces }]) => (
            <React.Fragment key={orgId}>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {org_name}
              </DropdownMenuLabel>

              {orgWorkspaces.map(ws => (
                <DropdownMenuItem
                  key={ws.workspace_id}
                  onClick={() => onWorkspaceChange(ws.workspace_id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {ws.workspace_id === currentWorkspaceId && (
                      <Check className="mr-2 h-4 w-4 text-primary" />
                    )}
                    {ws.workspace_id !== currentWorkspaceId && (
                      <div className="mr-2 w-4" />
                    )}
                    <span className="truncate max-w-[150px]">{ws.workspace_name}</span>
                  </div>
                  <Badge variant={getRoleBadgeVariant(ws.role_name)} className="ml-2 text-xs">
                    {ws.role_name}
                  </Badge>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
            </React.Fragment>
          ))}

          {currentWorkspace && ['owner', 'admin'].includes(currentWorkspace.role_name) && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to workspace settings
                  window.location.href = `/dashboard/settings/workspace?id=${currentWorkspaceId}`;
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Workspace Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  // Navigate to member management
                  window.location.href = `/dashboard/settings/members?workspace=${currentWorkspaceId}`;
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {canCreateWorkspace && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </DropdownMenuItem>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                  <DialogDescription>
                    Create a new workspace in {currentWorkspace?.org_name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      placeholder="e.g., Marketing Team"
                      value={newWorkspaceName}
                      onChange={e => setNewWorkspaceName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleCreateWorkspace();
                        }
                      }}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default WorkspaceSwitcher;
