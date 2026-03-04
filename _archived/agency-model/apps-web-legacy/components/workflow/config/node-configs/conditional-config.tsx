'use client';

/**
 * Conditional Node Configuration - Scientific Luxury Edition
 *
 * Configuration form for conditional/branching nodes.
 */

import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { SPECTRAL } from '@/lib/design-tokens';
import type { NodeConfigProps } from '../node-config-panel';

const OPERATORS = [
  { value: 'equals', label: '=', description: 'equals' },
  { value: 'not_equals', label: '≠', description: 'not equals' },
  { value: 'greater', label: '>', description: 'greater than' },
  { value: 'less', label: '<', description: 'less than' },
  { value: 'greater_eq', label: '≥', description: 'greater or equal' },
  { value: 'less_eq', label: '≤', description: 'less or equal' },
  { value: 'contains', label: '∈', description: 'contains' },
  { value: 'regex', label: '.*', description: 'regex match' },
  { value: 'exists', label: '∃', description: 'exists' },
];

interface Condition {
  variable: string;
  operator: string;
  value: string;
}

const DEFAULT_CONDITION: Condition[] = [{ variable: '', operator: 'equals', value: '' }];

export function ConditionalNodeConfig({ config, onChange }: NodeConfigProps) {
  const handleChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  const conditions = useMemo(
    () => (config.conditions as Condition[]) || DEFAULT_CONDITION,
    [config.conditions]
  );

  const addCondition = useCallback(() => {
    handleChange('conditions', [...conditions, { variable: '', operator: 'equals', value: '' }]);
  }, [conditions, handleChange]);

  const updateCondition = useCallback(
    (index: number, field: keyof Condition, value: string) => {
      const newConditions = [...conditions];
      newConditions[index] = { ...newConditions[index], [field]: value };
      handleChange('conditions', newConditions);
    },
    [conditions, handleChange]
  );

  const removeCondition = useCallback(
    (index: number) => {
      if (conditions.length > 1) {
        handleChange(
          'conditions',
          conditions.filter((_, i) => i !== index)
        );
      }
    },
    [conditions, handleChange]
  );

  return (
    <div className="space-y-4">
      {/* Logic Mode */}
      <div>
        <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Logic Mode</Label>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => handleChange('logicMode', 'and')}
            className={`flex-1 rounded-sm border-[0.5px] px-3 py-2 text-xs transition-all ${
              (config.logicMode as string) !== 'or'
                ? 'border-[#FFB800]/50 bg-[#FFB800]/10 text-[#FFB800]'
                : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
            }`}
          >
            AND (All must match)
          </button>
          <button
            onClick={() => handleChange('logicMode', 'or')}
            className={`flex-1 rounded-sm border-[0.5px] px-3 py-2 text-xs transition-all ${
              (config.logicMode as string) === 'or'
                ? 'border-[#FFB800]/50 bg-[#FFB800]/10 text-[#FFB800]'
                : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/5'
            }`}
          >
            OR (Any can match)
          </button>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Conditions</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addCondition}
            className="h-6 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="mt-2 space-y-3">
          {conditions.map((condition, index) => (
            <div
              key={index}
              className="rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={condition.variable}
                  onChange={(e) => updateCondition(index, 'variable', e.target.value)}
                  placeholder="{{variable}}"
                  className="flex-1 border-[0.5px] border-white/[0.06] bg-[#050505] font-mono text-xs text-white/90 placeholder:text-white/30"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  className="w-20 rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-2 py-2 text-center font-mono text-sm text-white/90"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                {condition.operator !== 'exists' && (
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 border-[0.5px] border-white/[0.06] bg-[#050505] font-mono text-xs text-white/90 placeholder:text-white/30"
                  />
                )}
                {conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    className="h-9 w-9 text-[#FF4444]/50 hover:bg-[#FF4444]/10 hover:text-[#FF4444]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[10px] text-white/30">
                {OPERATORS.find((op) => op.value === condition.operator)?.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Preview */}
      <div className="rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-4">
        <p className="mb-3 text-[10px] tracking-[0.2em] text-white/40 uppercase">Branch Outputs</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <div
              className="flex items-center gap-2 rounded-sm border-[0.5px] p-2"
              style={{
                borderColor: `${SPECTRAL.emerald}30`,
                backgroundColor: `${SPECTRAL.emerald}10`,
              }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SPECTRAL.emerald }} />
              <span className="text-xs" style={{ color: SPECTRAL.emerald }}>
                True
              </span>
            </div>
            <p className="mt-1 text-center text-[10px] text-white/30">Condition met</p>
          </div>
          <div className="flex-1">
            <div
              className="flex items-center gap-2 rounded-sm border-[0.5px] p-2"
              style={{
                borderColor: `${SPECTRAL.red}30`,
                backgroundColor: `${SPECTRAL.red}10`,
              }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SPECTRAL.red }} />
              <span className="text-xs" style={{ color: SPECTRAL.red }}>
                False
              </span>
            </div>
            <p className="mt-1 text-center text-[10px] text-white/30">Condition not met</p>
          </div>
        </div>
      </div>
    </div>
  );
}
