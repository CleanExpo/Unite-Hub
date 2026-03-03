'use client';

/**
 * LLM Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for LLM (Large Language Model) nodes.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { NodeConfigProps } from '../node-config-panel';

const LLM_MODELS = [
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'llama3.1:8b', label: 'Llama 3.1 8B', provider: 'Ollama' },
  { value: 'llama3.1:70b', label: 'Llama 3.1 70B', provider: 'Ollama' },
];

export function LLMNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Model</Label>
        <select
          value={(config.model as string) || 'claude-3-sonnet'}
          onChange={(e) => handleChange('model', e.target.value)}
          className="mt-2 w-full rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-3 py-2 text-sm text-white/90"
        >
          {LLM_MODELS.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label} ({model.provider})
            </option>
          ))}
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          System Prompt
        </Label>
        <Textarea
          value={(config.systemPrompt as string) || ''}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="You are a helpful assistant..."
          rows={4}
          className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
      </div>

      {/* Temperature */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Temperature</Label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={(config.temperature as number) || 0.7}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right font-mono text-sm text-white/70">
            {((config.temperature as number) || 0.7).toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-white/30">
          Lower = more focused, Higher = more creative
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Max Tokens</Label>
        <Input
          type="number"
          value={(config.maxTokens as number) || 4096}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
        />
      </div>

      {/* Streaming */}
      <div className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="text-sm text-white/90">Stream Response</p>
          <p className="text-[10px] text-white/40">Enable real-time token streaming</p>
        </div>
        <Switch
          checked={(config.streaming as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('streaming', checked)}
        />
      </div>

      {/* Input Variable */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Input Variable
        </Label>
        <Input
          value={(config.inputVariable as string) || 'input'}
          onChange={(e) => handleChange('inputVariable', e.target.value)}
          placeholder="Variable name from previous node"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
        <p className="mt-1 text-[10px] text-white/30">
          Reference: {'{{input}}'} or {'{{previousNode.output}}'}
        </p>
      </div>

      {/* Output Variable */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Output Variable
        </Label>
        <Input
          value={(config.outputVariable as string) || 'response'}
          onChange={(e) => handleChange('outputVariable', e.target.value)}
          placeholder="Variable name for output"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
      </div>
    </div>
  );
}
