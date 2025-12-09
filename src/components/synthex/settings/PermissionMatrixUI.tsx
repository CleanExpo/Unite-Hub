"use client";

/**
 * Permission Matrix UI (Phase E09)
 *
 * Role-based permission management interface
 * Display role → permission mapping with checkboxes
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  module: string;
  action: string;
  resource_type?: string;
  display_name: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permissions: string[]; // permission IDs
}

export default function PermissionMatrixUI() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch permissions
      const permsRes = await fetch("/api/permissions");
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissions(permsData.permissions || []);
      }

      // Fetch roles
      const rolesRes = await fetch("/api/roles");
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }
    } catch (error) {
      console.error("Error fetching permission data:", error);
      toast({
        title: "Error",
        description: "Failed to load permission matrix",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function savePermissions() {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: Array.from(pendingChanges) }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Permissions updated successfully",
        });
        setEditMode(false);
        fetchData();
      } else {
        throw new Error("Failed to update permissions");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive",
      });
    }
  }

  function togglePermission(permissionId: string) {
    const newChanges = new Set(pendingChanges);
    if (newChanges.has(permissionId)) {
      newChanges.delete(permissionId);
    } else {
      newChanges.add(permissionId);
    }
    setPendingChanges(newChanges);
  }

  function startEditing(role: Role) {
    setSelectedRole(role);
    setPendingChanges(new Set(role.permissions));
    setEditMode(true);
  }

  function cancelEditing() {
    setSelectedRole(null);
    setPendingChanges(new Set());
    setEditMode(false);
  }

  if (loading) {
    return (
      <Card className="bg-bg-card border-border">
        <CardContent className="py-8">
          <p className="text-center text-text-secondary">Loading permission matrix...</p>
        </CardContent>
      </Card>
    );
  }

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      {/* Roles List */}
      <Card className="bg-bg-card border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Roles</CardTitle>
          <CardDescription className="text-text-secondary">
            Manage permissions for each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-4 border border-border rounded-lg hover:bg-bg-hover cursor-pointer transition-colors"
                onClick={() => startEditing(role)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{role.display_name}</h3>
                  {role.is_system && (
                    <Badge variant="outline" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-2">{role.description}</p>
                <p className="text-xs text-text-tertiary">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix (when role selected) */}
      {editMode && selectedRole && (
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary">
                  Edit Permissions: {selectedRole.display_name}
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  {selectedRole.is_system
                    ? "System roles cannot be modified"
                    : "Select permissions for this role"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                {!selectedRole.is_system && (
                  <Button onClick={savePermissions} className="bg-accent-500 hover:bg-accent-600">
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="space-y-3">
                  <h4 className="font-semibold text-text-primary capitalize">{module}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-start space-x-2 p-3 rounded-md bg-bg-surface border border-border"
                      >
                        <Checkbox
                          id={perm.id}
                          checked={pendingChanges.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          disabled={selectedRole.is_system}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={perm.id}
                            className="text-sm font-medium text-text-primary cursor-pointer"
                          >
                            {perm.display_name}
                          </Label>
                          {perm.description && (
                            <p className="text-xs text-text-tertiary mt-1">{perm.description}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {perm.action}
                            </Badge>
                            {perm.resource_type && (
                              <Badge variant="outline" className="text-xs">
                                {perm.resource_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!editMode && roles.length === 0 && (
        <Card className="bg-bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary mb-4">No roles found</p>
            <Button className="bg-accent-500 hover:bg-accent-600">Create Role</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
