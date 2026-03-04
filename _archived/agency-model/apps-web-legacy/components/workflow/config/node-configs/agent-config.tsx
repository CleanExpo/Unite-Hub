'use client';

/**
 * Agent Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for AI Agent nodes.
 * Fetches available agents from GET /api/discovery/agents,
 * falling back to a hardcoded list when the API is unreachable.
 */

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api/client';
import type { NodeConfigProps } from '../node-config-panel';

interface AgentOption {
  value: string;
  label: string;
  description: string;
}

interface DiscoveryAgent {
  name: string;
  capabilities: string[];
}

interface AgentListResponse {
  agents: DiscoveryAgent[];
  total: number;
}

const FALLBACK_AGENTS: AgentOption[] = [
  { value: 'frontend', label: 'Frontend Agent', description: 'React, Next.js, UI tasks' },
  { value: 'backend', label: 'Backend Agent', description: 'Python, FastAPI, API tasks' },
  { value: 'database', label: 'Database Agent', description: 'SQL, migrations, queries' },
  { value: 'devops', label: 'DevOps Agent', description: 'Docker, CI/CD, deployment' },
  { value: 'general', label: 'General Agent', description: 'General-purpose tasks' },
];

function toAgentOption(agent: DiscoveryAgent): AgentOption {
  return {
    value: agent.name,
    label: agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + ' Agent',
    description: agent.capabilities.slice(0, 4).join(', ') || 'No capabilities listed',
  };
}

export function AgentNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const [agentTypes, setAgentTypes] = useState<AgentOption[]>(FALLBACK_AGENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<AgentListResponse>('/api/discovery/agents')
      .then((data) => {
        if (!cancelled && data.agents.length > 0) {
          setAgentTypes(data.agents.map(toAgentOption));
        }
      })
      .catch(() => {
        // Keep fallback list
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedValue = (config.agentType as string) || agentTypes[0]?.value || 'general';

  return (
    <div className="space-y-4">
      {/* Agent Type */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Agent Type</Label>
        {loading ? (
          <div className="mt-2 h-9 w-full animate-pulse rounded-sm bg-white/[0.04]" />
        ) : (
          <select
            value={selectedValue}
            onChange={(e) => handleChange('agentType', e.target.value)}
            className="mt-2 w-full rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-3 py-2 text-sm text-white/90"
          >
            {agentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-[10px] text-white/30">
          {agentTypes.find((t) => t.value === selectedValue)?.description}
        </p>
      </div>

      {/* Agent Instructions */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Agent Instructions
        </Label>
        <Textarea
          value={(config.instructions as string) || ''}
          onChange={(e) => handleChange('instructions', e.target.value)}
          placeholder="Describe what this agent should accomplish..."
          rows={4}
          className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
      </div>

      {/* Tools Selection */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Available Tools
        </Label>
        <div className="mt-2 space-y-2">
          {['web_search', 'code_interpreter', 'file_browser', 'calculator'].map((tool) => (
            <div
              key={tool}
              className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <span className="font-mono text-xs text-white/70">{tool}</span>
              <Switch
                checked={((config.tools as string[]) || []).includes(tool)}
                onCheckedChange={(checked) => {
                  const currentTools = (config.tools as string[]) || [];
                  handleChange(
                    'tools',
                    checked ? [...currentTools, tool] : currentTools.filter((t) => t !== tool)
                  );
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Max Iterations */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Max Iterations
        </Label>
        <Input
          type="number"
          value={(config.maxIterations as number) || 10}
          onChange={(e) => handleChange('maxIterations', parseInt(e.target.value))}
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
        />
        <p className="mt-1 text-[10px] text-white/30">Maximum reasoning loops before stopping</p>
      </div>

      {/* Verbose Logging */}
      <div className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="text-sm text-white/90">Verbose Logging</p>
          <p className="text-[10px] text-white/40">Log detailed agent reasoning steps</p>
        </div>
        <Switch
          checked={(config.verbose as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('verbose', checked)}
        />
      </div>

      {/* Human in the Loop */}
      <div className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="text-sm text-white/90">Human in the Loop</p>
          <p className="text-[10px] text-white/40">Require approval for critical actions</p>
        </div>
        <Switch
          checked={(config.humanInLoop as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('humanInLoop', checked)}
        />
      </div>
    </div>
  );
}
