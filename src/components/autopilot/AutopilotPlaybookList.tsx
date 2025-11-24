'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Calendar, Eye, RefreshCw } from 'lucide-react';
import type { AutopilotPlaybook } from '@/lib/autopilot';

interface AutopilotPlaybookListProps {
  playbooks: AutopilotPlaybook[];
  onSelect: (playbookId: string) => void;
  onGenerate: () => Promise<void>;
  isLoading?: boolean;
}

export function AutopilotPlaybookList({
  playbooks,
  onSelect,
  onGenerate,
  isLoading
}: AutopilotPlaybookListProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      completed: 'bg-blue-500',
      archived: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Playbooks
        </CardTitle>
        <Button
          onClick={handleGenerate}
          disabled={generating || isLoading}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          Generate New
        </Button>
      </CardHeader>
      <CardContent>
        {playbooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No playbooks yet. Generate your first weekly playbook.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-center">Auto-Executed</TableHead>
                <TableHead className="text-center">Awaiting</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playbooks.map((playbook) => (
                <TableRow key={playbook.id}>
                  <TableCell>
                    <div className="font-medium">
                      {new Date(playbook.periodStart).toLocaleDateString()} - {' '}
                      {new Date(playbook.periodEnd).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(playbook.status)}>
                      {playbook.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {playbook.totalActions}
                  </TableCell>
                  <TableCell className="text-center">
                    {playbook.autoExecuted || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {playbook.awaitingApproval || 0}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelect(playbook.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
