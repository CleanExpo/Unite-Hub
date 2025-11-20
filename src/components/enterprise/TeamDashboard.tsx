'use client';

/**
 * TeamDashboard Component
 * Phase 12 Week 3-4: Enterprise Team Structures
 *
 * Lists teams, members, permissions, and business unit mappings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  Building2,
  Shield,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  bu_id?: string;
  lead_user_id?: string;
  member_count: number;
  workspace_count: number;
  is_active: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  role_name: string;
  full_name?: string;
  email?: string;
  joined_at: string;
}

interface BusinessUnit {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

interface TeamDashboardProps {
  organizationId: string;
  canManageTeams?: boolean;
}

export function TeamDashboard({ organizationId, canManageTeams = false }: TeamDashboardProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  // Form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamType, setNewTeamType] = useState('standard');
  const [newTeamBuId, setNewTeamBuId] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('team_member');

  useEffect(() => {
    loadTeams();
  }, [organizationId]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enterprise/teams?org_id=${organizationId}`);
      const data = await response.json();

      if (data.success) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/enterprise/teams?team_id=${teamId}`);
      const data = await response.json();

      if (data.success && data.data.members) {
        setTeamMembers(data.data.members);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const response = await fetch('/api/enterprise/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: organizationId,
          name: newTeamName,
          description: newTeamDescription,
          team_type: newTeamType,
          bu_id: newTeamBuId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateDialogOpen(false);
        setNewTeamName('');
        setNewTeamDescription('');
        setNewTeamType('standard');
        setNewTeamBuId('');
        await loadTeams();
      } else {
        alert(data.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/enterprise/teams?team_id=${teamId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadTeams();
        if (selectedTeam?.id === teamId) {
          setSelectedTeam(null);
          setTeamMembers([]);
        }
      } else {
        alert(data.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team');
    }
  };

  const getTeamTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'department': return 'default';
      case 'project': return 'secondary';
      case 'cross_functional': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'team_lead': return 'default';
      case 'team_admin': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-sm text-muted-foreground">
            Manage teams, members, and permissions
          </p>
        </div>
        {canManageTeams && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Teams List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams yet</p>
            ) : (
              <div className="space-y-2">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      selectedTeam?.id === team.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedTeam(team);
                      loadTeamMembers(team.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant={getTeamTypeBadgeVariant(team.team_type)}>
                        {team.team_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{team.member_count} members</span>
                      <span>{team.workspace_count} workspaces</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTeam ? selectedTeam.name : 'Select a Team'}
            </CardTitle>
            {selectedTeam?.description && (
              <CardDescription>{selectedTeam.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedTeam ? (
              <div className="space-y-6">
                {/* Team Actions */}
                {canManageTeams && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddMemberDialogOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}

                {/* Members Table */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Members</h4>
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell>
                              {member.full_name || member.email || member.user_id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(member.role_name)}>
                                {member.role_name.replace('team_', '')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a team to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team to organize members and manage access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Marketing Team"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Input
                id="team-description"
                placeholder="Optional description"
                value={newTeamDescription}
                onChange={e => setNewTeamDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Team Type</Label>
              <Select value={newTeamType} onValueChange={setNewTeamType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="cross_functional">Cross-Functional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a member to {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">User Email</Label>
              <Input
                id="member-email"
                placeholder="user@example.com"
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="team_admin">Team Admin</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                  <SelectItem value="team_contributor">Contributor</SelectItem>
                  <SelectItem value="team_viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!newMemberEmail.trim()}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeamDashboard;
