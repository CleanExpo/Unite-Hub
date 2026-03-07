'use client';
import { AssigneeType } from '@/types/kanban';

const FILTERS: { value: AssigneeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'self', label: '✦ You' },
  { value: 'agent', label: '🤖 Agents' },
  { value: 'staff', label: '👤 Staff' },
  { value: 'client', label: '🏢 Clients' },
];

export function AssigneeFilter({ value, onChange }: { value: string; onChange: (v: AssigneeType | 'all') => void }) {
  return (
    <div className="flex gap-1">
      {FILTERS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`px-3 py-1 text-xs font-mono rounded-sm border transition-colors ${value === f.value ? 'border-cyan-400/60 text-cyan-400 bg-cyan-400/10' : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
