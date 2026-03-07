/**
 * Campaign Toolbar Component
 *
 * Toolbar for adding nodes and controlling the campaign builder
 *
 * @module components/campaigns/builder/CampaignToolbar
 */

'use client';

import { Play, Mail, Clock, GitBranch, Split, Zap, Flag, Save } from 'lucide-react';

interface CampaignToolbarProps {
  onAddNode: (type: string) => void;
  onSave: () => void;
}

const nodeButtons = [
  { type: 'trigger',   label: 'Trigger',   icon: Play,      accent: '#00FF88' },
  { type: 'email',     label: 'Email',     icon: Mail,      accent: '#00F5FF' },
  { type: 'wait',      label: 'Wait',      icon: Clock,     accent: '#FFB800' },
  { type: 'condition', label: 'Condition', icon: GitBranch, accent: '#FF00FF' },
  { type: 'split',     label: 'A/B Split', icon: Split,     accent: '#FF00FF' },
  { type: 'action',    label: 'Action',    icon: Zap,       accent: '#00F5FF' },
  { type: 'exit',      label: 'Exit',      icon: Flag,      accent: '#FF4444' },
];

export function CampaignToolbar({ onAddNode, onSave }: CampaignToolbarProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-2 space-y-2 max-w-[200px]">
      {/* Title */}
      <div className="px-2 py-1 text-xs font-mono font-semibold text-white/60 border-b border-white/[0.06]">
        Add Nodes
      </div>

      {/* Node Buttons */}
      <div className="space-y-1">
        {nodeButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => onAddNode(button.type)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-[#050505] text-sm font-mono font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: button.accent }}
            title={`Add ${button.label} node`}
          >
            <button.icon className="w-4 h-4" />
            <span>{button.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] my-2" />

      {/* Save Button */}
      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm bg-[#00F5FF] hover:opacity-80 text-[#050505] text-sm font-mono font-medium transition-opacity"
        title="Save campaign"
      >
        <Save className="w-4 h-4" />
        <span>Save</span>
      </button>

      {/* Help Text */}
      <div className="px-2 py-1 text-[10px] font-mono text-white/30">
        Click to add nodes to canvas. Connect them by dragging from output to input handles.
      </div>
    </div>
  );
}
