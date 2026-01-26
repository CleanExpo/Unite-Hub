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
  { type: 'trigger', label: 'Trigger', icon: Play, color: 'bg-emerald-500 hover:bg-emerald-600' },
  { type: 'email', label: 'Email', icon: Mail, color: 'bg-indigo-500 hover:bg-indigo-600' },
  { type: 'wait', label: 'Wait', icon: Clock, color: 'bg-amber-500 hover:bg-amber-600' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-violet-500 hover:bg-violet-600' },
  { type: 'split', label: 'A/B Split', icon: Split, color: 'bg-fuchsia-500 hover:bg-fuchsia-600' },
  { type: 'action', label: 'Action', icon: Zap, color: 'bg-cyan-500 hover:bg-cyan-600' },
  { type: 'exit', label: 'Exit', icon: Flag, color: 'bg-red-500 hover:bg-red-600' },
];

export function CampaignToolbar({ onAddNode, onSave }: CampaignToolbarProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-2 space-y-2 max-w-[200px]">
      {/* Title */}
      <div className="px-2 py-1 text-xs font-semibold text-gray-700 border-b border-gray-200">
        Add Nodes
      </div>

      {/* Node Buttons */}
      <div className="space-y-1">
        {nodeButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => onAddNode(button.type)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-md
              text-white text-sm font-medium transition-colors
              ${button.color}
            `}
            title={`Add ${button.label} node`}
          >
            <button.icon className="w-4 h-4" />
            <span>{button.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2" />

      {/* Save Button */}
      <button
        onClick={onSave}
        className="
          w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md
          bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
          transition-colors
        "
        title="Save campaign"
      >
        <Save className="w-4 h-4" />
        <span>Save</span>
      </button>

      {/* Help Text */}
      <div className="px-2 py-1 text-[10px] text-gray-500">
        Click to add nodes to canvas. Connect them by dragging from output to input handles.
      </div>
    </div>
  );
}
