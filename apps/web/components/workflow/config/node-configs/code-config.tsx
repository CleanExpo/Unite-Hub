'use client';

/**
 * Code Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for code execution nodes.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { NodeConfigProps } from '../node-config-panel';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'python', label: 'Python', extension: '.py' },
];

export function CodeNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const selectedLang =
    LANGUAGES.find((l) => l.value === (config.language as string)) || LANGUAGES[0];

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Language</Label>
        <div className="mt-2 flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleChange('language', lang.value)}
              className={`flex-1 rounded-sm border-[0.5px] px-3 py-2 text-xs transition-all ${
                (config.language as string) === lang.value
                  ? 'border-[#00FF88]/50 bg-[#00FF88]/10 text-[#00FF88]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Code</Label>
        <div className="mt-2 overflow-hidden rounded-sm border-[0.5px] border-white/[0.06] bg-[#0a0a0a]">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b-[0.5px] border-white/[0.06] px-3 py-2">
            <span className="font-mono text-[10px] text-white/40">
              main{selectedLang.extension}
            </span>
            <span className="text-[10px] text-white/30">
              {((config.code as string) || '').split('\n').length} lines
            </span>
          </div>
          <Textarea
            value={
              (config.code as string) || getDefaultCode((config.language as string) || 'javascript')
            }
            onChange={(e) => handleChange('code', e.target.value)}
            rows={12}
            spellCheck={false}
            className="resize-none border-none bg-transparent font-mono text-xs leading-relaxed text-white/90 placeholder:text-white/30 focus:ring-0 focus-visible:ring-0"
            style={{ minHeight: '240px' }}
          />
        </div>
      </div>

      {/* Input Variables */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Input Variables
        </Label>
        <Input
          value={(config.inputVariables as string) || ''}
          onChange={(e) => handleChange('inputVariables', e.target.value)}
          placeholder="data, context, previousResult"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
        <p className="mt-1 text-[10px] text-white/30">
          Comma-separated list of variables available in your code
        </p>
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

      {/* Timeout */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Execution Timeout (seconds)
        </Label>
        <Input
          type="number"
          value={(config.timeout as number) || 30}
          onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
        />
      </div>

      {/* Sandboxed Environment Notice */}
      <div className="rounded-sm border-[0.5px] border-[#FFB800]/20 bg-[#FFB800]/5 p-3">
        <p className="text-[10px] text-[#FFB800]/80">
          ⚠ Code runs in a sandboxed environment with limited system access.
        </p>
      </div>
    </div>
  );
}

function getDefaultCode(language: string): string {
  switch (language) {
    case 'javascript':
      return `// Process input and return result
const result = {
  processed: true,
  data: input,
  timestamp: new Date().toISOString()
};

return result;`;
    case 'typescript':
      return `// Process input and return result
interface Result {
  processed: boolean;
  data: unknown;
  timestamp: string;
}

const result: Result = {
  processed: true,
  data: input,
  timestamp: new Date().toISOString()
};

return result;`;
    case 'python':
      return `# Process input and return result
from datetime import datetime

result = {
    "processed": True,
    "data": input_data,
    "timestamp": datetime.now().isoformat()
}

return result`;
    default:
      return '';
  }
}
