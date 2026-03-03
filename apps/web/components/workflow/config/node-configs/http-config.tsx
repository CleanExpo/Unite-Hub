'use client';

/**
 * HTTP Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for HTTP/API request nodes.
 */

import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { NodeConfigProps } from '../node-config-panel';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

interface Header {
  key: string;
  value: string;
}

export function HttpNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const headers = useMemo(() => (config.headers as Header[]) || [], [config.headers]);

  const addHeader = useCallback(() => {
    handleChange('headers', [...headers, { key: '', value: '' }]);
  }, [headers, handleChange]);

  const updateHeader = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      const newHeaders = [...headers];
      newHeaders[index] = { ...newHeaders[index], [field]: value };
      handleChange('headers', newHeaders);
    },
    [headers, handleChange]
  );

  const removeHeader = useCallback(
    (index: number) => {
      handleChange(
        'headers',
        headers.filter((_, i) => i !== index)
      );
    },
    [headers, handleChange]
  );

  return (
    <div className="space-y-4">
      {/* Method Selection */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Method</Label>
        <div className="mt-2 flex gap-2">
          {HTTP_METHODS.map((method) => (
            <button
              key={method}
              onClick={() => handleChange('method', method)}
              className={`flex-1 rounded-sm border-[0.5px] px-3 py-2 font-mono text-xs transition-all ${
                (config.method as string) === method
                  ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 text-[#00F5FF]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* URL */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">URL</Label>
        <Input
          value={(config.url as string) || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
        <p className="mt-1 text-[10px] text-white/30">Use {'{{variable}}'} for dynamic values</p>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Headers</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addHeader}
            className="h-6 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30"
              />
              <Input
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(index)}
                className="h-9 w-9 text-[#FF4444]/50 hover:bg-[#FF4444]/10 hover:text-[#FF4444]"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {headers.length === 0 && (
            <p className="py-2 text-center text-[10px] text-white/30">No headers configured</p>
          )}
        </div>
      </div>

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes((config.method as string) || 'GET') && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Request Body
          </Label>
          <Textarea
            value={(config.body as string) || ''}
            onChange={(e) => handleChange('body', e.target.value)}
            placeholder='{"key": "value"}'
            rows={6}
            className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-xs text-white/90 placeholder:text-white/30 focus:border-white/20"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleChange('contentType', 'application/json')}
              className={`rounded-sm border-[0.5px] px-2 py-1 text-[10px] ${
                (config.contentType as string) === 'application/json'
                  ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 text-[#00F5FF]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => handleChange('contentType', 'application/x-www-form-urlencoded')}
              className={`rounded-sm border-[0.5px] px-2 py-1 text-[10px] ${
                (config.contentType as string) === 'application/x-www-form-urlencoded'
                  ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 text-[#00F5FF]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => handleChange('contentType', 'text/plain')}
              className={`rounded-sm border-[0.5px] px-2 py-1 text-[10px] ${
                (config.contentType as string) === 'text/plain'
                  ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 text-[#00F5FF]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              Text
            </button>
          </div>
        </div>
      )}

      {/* Response Mapping */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Response Path (JSONPath)
        </Label>
        <Input
          value={(config.responsePath as string) || ''}
          onChange={(e) => handleChange('responsePath', e.target.value)}
          placeholder="$.data.results[0]"
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
        />
        <p className="mt-1 text-[10px] text-white/30">Extract specific data from the response</p>
      </div>
    </div>
  );
}
