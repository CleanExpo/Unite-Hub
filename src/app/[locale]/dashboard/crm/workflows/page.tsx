"use client";

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Power, PowerOff, GitBranch } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  workflow_triggers: any[];
  workflow_conditions: any[];
  workflow_actions: any[];
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/crm/workflows');
      setWorkflows(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflow: Workflow) => {
    try {
      await apiClient.put(`/api/crm/workflows/${workflow.id}`, {
        ...workflow,
        is_active: !workflow.is_active
      });
      
      toast({
        title: 'Success',
        description: `Workflow ${!workflow.is_active ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workflow status',
        variant: 'destructive'
      });
    }
  };

  const deleteWorkflow = async () => {
    if (!deleteWorkflowId) return;
    
    try {
      await apiClient.delete(`/api/crm/workflows/${deleteWorkflowId}`);
      
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully'
      });
      
      setDeleteWorkflowId(null);
      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive'
      });
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      'deal_stage_change': 'Deal Stage Changed',
      'task_status_change': 'Task Status Changed',
      'client_created': 'New Client Created',
      'project_status_change': 'Project Status Changed'
    };
    return labels[triggerType] || triggerType;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Automate your CRM processes with powerful workflows
          </p>
        </div>
        <Link href="/en/dashboard/crm/workflows/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
          <CardDescription>
            Manage your automated workflows and their triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No workflows</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new workflow.
              </p>
              <div className="mt-6">
                <Link href="/en/dashboard/crm/workflows/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-muted-foreground">
                            {workflow.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTriggerLabel(workflow.trigger_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {workflow.workflow_conditions?.length || 0} conditions
                    </TableCell>
                    <TableCell>
                      {workflow.workflow_actions?.length || 0} actions
                    </TableCell>
                    <TableCell>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWorkflowStatus(workflow)}
                          title={workflow.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {workflow.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/en/dashboard/crm/workflows/${workflow.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteWorkflowId(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workflow
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteWorkflow}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
