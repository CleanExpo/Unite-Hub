'use client';

/**
 * Tool Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for tool execution nodes.
 * Fetches available tools from GET /api/discovery/tools,
 * falling back to a hardcoded list when the API is unreachable.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { NodeConfigProps } from '../node-config-panel';

interface ToolOption {
  value: string;
  label: string;
  description: string;
}

interface DiscoveryTool {
  name: string;
  description: string;
  categories: string[];
  has_handler: boolean;
}

interface ToolListResponse {
  tools: DiscoveryTool[];
  total: number;
}

const FALLBACK_TOOLS: ToolOption[] = [
  { value: 'web_search', label: 'Web Search', description: 'Search the web for information' },
  { value: 'web_scrape', label: 'Web Scrape', description: 'Extract content from URLs' },
  { value: 'file_read', label: 'File Read', description: 'Read file contents' },
  { value: 'file_write', label: 'File Write', description: 'Write content to files' },
  { value: 'database_query', label: 'Database Query', description: 'Execute SQL queries' },
  { value: 'send_email', label: 'Send Email', description: 'Send email notifications' },
  { value: 'slack_message', label: 'Slack Message', description: 'Post to Slack channels' },
  { value: 'custom', label: 'Custom Tool', description: 'Define a custom tool' },
];

function toToolOption(tool: DiscoveryTool): ToolOption {
  const label = tool.name.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const suffix = tool.has_handler ? '' : ' (no handler)';
  return {
    value: tool.name,
    label: label + suffix,
    description: tool.description || tool.categories.join(', ') || 'No description',
  };
}

interface Parameter {
  name: string;
  value: string;
}

export function ToolNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const [toolOptions, setToolOptions] = useState<ToolOption[]>(FALLBACK_TOOLS);
  const [toolsLoading, setToolsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ToolListResponse>('/api/discovery/tools')
      .then((data) => {
        if (!cancelled && data.tools.length > 0) {
          const fetched = data.tools.map(toToolOption);
          // Always keep the "custom" option at the end
          fetched.push({
            value: 'custom',
            label: 'Custom Tool',
            description: 'Define a custom tool',
          });
          setToolOptions(fetched);
        }
      })
      .catch(() => {
        // Keep fallback list
      })
      .finally(() => {
        if (!cancelled) setToolsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parameters = useMemo(() => (config.parameters as Parameter[]) || [], [config.parameters]);
  const selectedTool = (config.tool as string) || toolOptions[0]?.value || 'web_search';

  const addParameter = useCallback(() => {
    handleChange('parameters', [...parameters, { name: '', value: '' }]);
  }, [parameters, handleChange]);

  const updateParameter = useCallback(
    (index: number, field: 'name' | 'value', value: string) => {
      const newParams = [...parameters];
      newParams[index] = { ...newParams[index], [field]: value };
      handleChange('parameters', newParams);
    },
    [parameters, handleChange]
  );

  const removeParameter = useCallback(
    (index: number) => {
      handleChange(
        'parameters',
        parameters.filter((_, i) => i !== index)
      );
    },
    [parameters, handleChange]
  );

  return (
    <div className="space-y-4">
      {/* Tool Selection */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Tool</Label>
        {toolsLoading ? (
          <div className="mt-2 h-9 w-full animate-pulse rounded-sm bg-white/[0.04]" />
        ) : (
          <select
            value={selectedTool}
            onChange={(e) => handleChange('tool', e.target.value)}
            className="mt-2 w-full rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-3 py-2 text-sm text-white/90"
          >
            {toolOptions.map((tool) => (
              <option key={tool.value} value={tool.value}>
                {tool.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-[10px] text-white/30">
          {toolOptions.find((t) => t.value === selectedTool)?.description}
        </p>
      </div>

      {/* Tool-specific configurations */}
      {selectedTool === 'web_search' && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Search Query
          </Label>
          <Input
            value={(config.query as string) || ''}
            onChange={(e) => handleChange('query', e.target.value)}
            placeholder="{{input}} site:docs.example.com"
            className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
          />
        </div>
      )}

      {selectedTool === 'web_scrape' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">URL</Label>
            <Input
              value={(config.url as string) || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com/page"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              CSS Selector (optional)
            </Label>
            <Input
              value={(config.selector as string) || ''}
              onChange={(e) => handleChange('selector', e.target.value)}
              placeholder=".main-content article"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        </>
      )}

      {selectedTool === 'database_query' && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">SQL Query</Label>
          <Textarea
            value={(config.query as string) || ''}
            onChange={(e) => handleChange('query', e.target.value)}
            placeholder="SELECT * FROM users WHERE status = 'active'"
            rows={4}
            className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30 focus:border-white/20"
          />
          <div className="mt-2 rounded-sm border-[0.5px] border-[#FFB800]/20 bg-[#FFB800]/5 p-2">
            <p className="text-[10px] text-[#FFB800]/80">
              ⚠ Use parameterised queries to prevent SQL injection
            </p>
          </div>
        </div>
      )}

      {selectedTool === 'send_email' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">To</Label>
            <Input
              value={(config.to as string) || ''}
              onChange={(e) => handleChange('to', e.target.value)}
              placeholder="recipient@example.com"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Subject</Label>
            <Input
              value={(config.subject as string) || ''}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Workflow notification"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Body</Label>
            <Textarea
              value={(config.body as string) || ''}
              onChange={(e) => handleChange('body', e.target.value)}
              placeholder="Email content with {{variables}}"
              rows={4}
              className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        </>
      )}

      {selectedTool === 'slack_message' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Channel</Label>
            <Input
              value={(config.channel as string) || ''}
              onChange={(e) => handleChange('channel', e.target.value)}
              placeholder="#notifications"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Message</Label>
            <Textarea
              value={(config.message as string) || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Workflow completed: {{result}}"
              rows={3}
              className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        </>
      )}

      {/* Custom Tool Configuration */}
      {selectedTool === 'custom' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Tool Name
            </Label>
            <Input
              value={(config.toolName as string) || ''}
              onChange={(e) => handleChange('toolName', e.target.value)}
              placeholder="my_custom_tool"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Tool Description
            </Label>
            <Textarea
              value={(config.toolDescription as string) || ''}
              onChange={(e) => handleChange('toolDescription', e.target.value)}
              placeholder="Describe what this tool does..."
              rows={2}
              className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        </>
      )}

      {/* Parameters */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Parameters</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addParameter}
            className="h-6 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {parameters.map((param, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={param.name}
                onChange={(e) => updateParameter(index, 'name', e.target.value)}
                placeholder="Parameter name"
                className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30"
              />
              <Input
                value={param.value}
                onChange={(e) => updateParameter(index, 'value', e.target.value)}
                placeholder="{{value}}"
                className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeParameter(index)}
                className="h-9 w-9 text-[#FF4444]/50 hover:bg-[#FF4444]/10 hover:text-[#FF4444]"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {parameters.length === 0 && (
            <p className="py-2 text-center text-[10px] text-white/30">No parameters configured</p>
          )}
        </div>
      </div>

      {/* Output Variable */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Output Variable
        </Label>
        <Input
          value={(config.outputVariable as string) || 'result'}
          onChange={(e) => handleChange('outputVariable', e.target.value)}
          placeholder="result"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
      </div>
    </div>
  );
}
