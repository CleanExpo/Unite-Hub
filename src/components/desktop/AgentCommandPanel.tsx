'use client';

/**
 * Agent Command Panel - Command builder and dispatcher
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertTriangle } from 'lucide-react';
import { AgentCommandBuilder } from '@/lib/desktopAgent/agentCommandBuilder';

interface AgentCommandPanelProps {
  workspaceId: string;
  accessToken: string;
  onCommandSent?: (commandId: string) => void;
}

export function AgentCommandPanel({
  workspaceId,
  accessToken,
  onCommandSent,
}: AgentCommandPanelProps) {
  const [selectedCommand, setSelectedCommand] = useState('click');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const commands = [
    { name: 'click', label: 'Click', params: ['x', 'y'] },
    { name: 'typeText', label: 'Type Text', params: ['text'] },
    { name: 'pressKey', label: 'Press Key', params: ['key'] },
    { name: 'moveMouse', label: 'Move Mouse', params: ['x', 'y'] },
    { name: 'scroll', label: 'Scroll', params: ['direction', 'amount'] },
    { name: 'openApp', label: 'Open App', params: ['appName'] },
    { name: 'navigateUrl', label: 'Navigate', params: ['url'] },
    { name: 'getScreenshot', label: 'Screenshot', params: [] },
  ];

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/desktop/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          commandName: selectedCommand,
          parameters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Command failed');
        return;
      }

      setResult(`Command ${data.status}: ${data.commandId}`);
      onCommandSent?.(data.commandId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExecuting(false);
    }
  };

  const currentCommand = commands.find((c) => c.name === selectedCommand);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Command Builder</CardTitle>
        <CardDescription>Construct and dispatch desktop commands</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✓ {result}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Command</label>
            <div className="flex flex-wrap gap-2">
              {commands.map((cmd) => (
                <Button
                  key={cmd.name}
                  variant={selectedCommand === cmd.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCommand(cmd.name);
                    setParameters({});
                  }}
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>

          {currentCommand && currentCommand.params.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Parameters</label>
              {currentCommand.params.map((param) => (
                <input
                  key={param}
                  type="text"
                  placeholder={param}
                  value={parameters[param] || ''}
                  onChange={(e) =>
                    setParameters({ ...parameters, [param]: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border-base rounded bg-bg-card text-sm"
                />
              ))}
            </div>
          )}

          <Button
            onClick={handleExecute}
            disabled={executing}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {executing ? 'Executing...' : 'Execute Command'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
