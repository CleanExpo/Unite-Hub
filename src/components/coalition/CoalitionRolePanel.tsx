'use client';

import React from 'react';
import { useCoalitionStore } from '@/state/useCoalitionStore';
import {
  formatRole,
  getRoleColor,
  formatPercentage,
  getRiskColor,
} from '@/lib/coalition/coalitionClient';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, CheckCircle } from 'lucide-react';

export interface CoalitionRolePanelProps {
  workspaceId: string;
}

export function CoalitionRolePanel({ workspaceId }: CoalitionRolePanelProps) {
  const { roleAssignments, coalitionMembers, activeCoalition, isLoadingMembers } =
    useCoalitionStore();

  if (isLoadingMembers) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!activeCoalition || roleAssignments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-text-secondary">
            No active coalition roles. Roles will appear when a coalition forms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['leader', 'planner', 'executor', 'validator'].map((roleType) => {
          const assignment = roleAssignments.find((r) => r.role === roleType);
          const member = coalitionMembers.find((m) => m.agentId === assignment?.agentId);

          return (
            <div
              key={roleType}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary mb-1">
                    {formatRole(roleType)}
                  </p>
                  {assignment && member ? (
                    <>
                      <p className="font-semibold text-text-primary truncate">
                        {member.agentId}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getRoleColor(roleType)}>
                          {formatRole(roleType)}
                        </Badge>
                        {assignment.conflictDetected && (
                          <Badge variant="destructive">Conflict</Badge>
                        )}
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-text-secondary">
                          <span>Capability Match</span>
                          <span className="font-medium">
                            {formatPercentage(member.capabilityMatch)}
                          </span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Success Rate</span>
                          <span className="font-medium">
                            {formatPercentage(member.successRate)}
                          </span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Role Score</span>
                          <span className="font-medium">
                            {formatPercentage(assignment.allocationScore)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-text-secondary italic">
                      Unassigned
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict Resolution Section */}
      {roleAssignments.some((r) => r.conflictDetected) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Role Conflicts Detected
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {roleAssignments.filter((r) => r.conflictDetected).length} role conflict
                {roleAssignments.filter((r) => r.conflictDetected).length !== 1 ? 's' : ''}{' '}
                resolved via arbitration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Members Detail */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-text-primary">
            Coalition Members
          </h3>
        </div>

        <div className="divide-y divide-border-subtle">
          {coalitionMembers.map((member) => (
            <div key={member.agentId} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {member.agentId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleColor(member.primaryRole)}>
                      {formatRole(member.primaryRole)}
                    </Badge>
                    {member.secondaryRoles.length > 0 && (
                      <span className="text-xs text-text-secondary">
                        +{member.secondaryRoles.length} secondary
                      </span>
                    )}
                    {member.status === 'active' && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-secondary">Capability</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatPercentage(member.capabilityMatch)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                  <p className="text-text-secondary">Success Rate</p>
                  <p className="font-semibold text-text-primary">
                    {formatPercentage(member.successRate)}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                  <p className="text-text-secondary">Status</p>
                  <p className={`font-semibold ${member.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {member.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
