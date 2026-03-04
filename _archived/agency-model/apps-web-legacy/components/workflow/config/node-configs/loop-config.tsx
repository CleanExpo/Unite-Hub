'use client';

/**
 * Loop Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for loop/iteration nodes.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { NodeConfigProps } from '../node-config-panel';

const LOOP_TYPES = [
  { value: 'forEach', label: 'For Each', description: 'Iterate over each item in array' },
  { value: 'while', label: 'While', description: 'Loop while condition is true' },
  { value: 'times', label: 'N Times', description: 'Run a fixed number of times' },
  { value: 'batch', label: 'Batch', description: 'Process items in batches' },
];

export function LoopNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const loopType = (config.loopType as string) || 'forEach';

  return (
    <div className="space-y-4">
      {/* Loop Type */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Loop Type</Label>
        <select
          value={loopType}
          onChange={(e) => handleChange('loopType', e.target.value)}
          className="mt-2 w-full rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-3 py-2 text-sm text-white/90"
        >
          {LOOP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-white/30">
          {LOOP_TYPES.find((t) => t.value === loopType)?.description}
        </p>
      </div>

      {/* For Each Settings */}
      {loopType === 'forEach' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Input Array
            </Label>
            <Input
              value={(config.inputArray as string) || ''}
              onChange={(e) => handleChange('inputArray', e.target.value)}
              placeholder="{{previousNode.items}}"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Item Variable Name
            </Label>
            <Input
              value={(config.itemVariable as string) || 'item'}
              onChange={(e) => handleChange('itemVariable', e.target.value)}
              placeholder="item"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
            <p className="mt-1 text-[10px] text-white/30">
              Access current item as {'{{item}}'} in child nodes
            </p>
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Index Variable Name
            </Label>
            <Input
              value={(config.indexVariable as string) || 'index'}
              onChange={(e) => handleChange('indexVariable', e.target.value)}
              placeholder="index"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
        </>
      )}

      {/* While Settings */}
      {loopType === 'while' && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Condition</Label>
          <Input
            value={(config.condition as string) || ''}
            onChange={(e) => handleChange('condition', e.target.value)}
            placeholder="{{hasMorePages}} === true"
            className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
          />
          <p className="mt-1 text-[10px] text-white/30">
            Loop continues while this evaluates to true
          </p>
        </div>
      )}

      {/* Times Settings */}
      {loopType === 'times' && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Number of Iterations
          </Label>
          <Input
            type="number"
            value={(config.iterations as number) || 10}
            onChange={(e) => handleChange('iterations', parseInt(e.target.value))}
            className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
          />
        </div>
      )}

      {/* Batch Settings */}
      {loopType === 'batch' && (
        <>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Input Array
            </Label>
            <Input
              value={(config.inputArray as string) || ''}
              onChange={(e) => handleChange('inputArray', e.target.value)}
              placeholder="{{previousNode.items}}"
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/20"
            />
          </div>
          <div>
            <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Batch Size
            </Label>
            <Input
              type="number"
              value={(config.batchSize as number) || 10}
              onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
              className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
            />
          </div>
        </>
      )}

      {/* Max Iterations (Safety) */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Max Iterations (Safety Limit)
        </Label>
        <Input
          type="number"
          value={(config.maxIterations as number) || 1000}
          onChange={(e) => handleChange('maxIterations', parseInt(e.target.value))}
          className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
        />
        <p className="mt-1 text-[10px] text-white/30">
          Prevents infinite loops by stopping after this many iterations
        </p>
      </div>

      {/* Parallel Execution */}
      <div className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="text-sm text-white/90">Parallel Execution</p>
          <p className="text-[10px] text-white/40">
            Run iterations concurrently (faster but unordered)
          </p>
        </div>
        <Switch
          checked={(config.parallel as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('parallel', checked)}
        />
      </div>

      {Boolean(config.parallel) && (
        <div>
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Concurrency Limit
          </Label>
          <Input
            type="number"
            value={(config.concurrency as number) || 5}
            onChange={(e) => handleChange('concurrency', parseInt(e.target.value))}
            className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90"
          />
          <p className="mt-1 text-[10px] text-white/30">Maximum number of concurrent iterations</p>
        </div>
      )}

      {/* Collect Results */}
      <div className="flex items-center justify-between rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <p className="text-sm text-white/90">Collect Results</p>
          <p className="text-[10px] text-white/40">Gather all iteration outputs into an array</p>
        </div>
        <Switch
          checked={(config.collectResults as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('collectResults', checked)}
        />
      </div>
    </div>
  );
}
