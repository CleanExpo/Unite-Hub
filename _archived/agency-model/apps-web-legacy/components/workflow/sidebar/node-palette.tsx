'use client';

/**
 * Node Palette - Scientific Luxury Edition
 *
 * Draggable node palette for workflow builder.
 * Implements spectral colour system and physics-based animations.
 *
 * @see docs/DESIGN_SYSTEM.md for styling reference
 */

import { DragEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Zap,
  Square,
  Send,
  Brain,
  Bot,
  Wrench,
  MousePointer,
  GitBranch,
  Cog,
  Repeat,
  Database,
  Globe,
  Code,
  CheckCircle,
} from 'lucide-react';
import { SPECTRAL, BACKGROUNDS, EASINGS, DURATIONS } from '@/lib/design-tokens';
import type { NodeType } from '@/types/workflow';

// Node category definitions with icons
interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface NodeCategory {
  name: string;
  colour: string;
  nodes: NodeDefinition[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    name: 'Flow Control',
    colour: SPECTRAL.cyan,
    nodes: [
      { type: 'start', label: 'Start', description: 'Workflow entry point', icon: Play },
      { type: 'trigger', label: 'Trigger', description: 'Event trigger', icon: Zap },
      { type: 'end', label: 'End', description: 'Workflow exit', icon: Square },
      { type: 'output', label: 'Output', description: 'Return result', icon: Send },
    ],
  },
  {
    name: 'AI & Agents',
    colour: SPECTRAL.magenta,
    nodes: [
      { type: 'llm', label: 'LLM', description: 'Large language model', icon: Brain },
      { type: 'agent', label: 'Agent', description: 'AI agent execution', icon: Bot },
    ],
  },
  {
    name: 'Actions',
    colour: SPECTRAL.emerald,
    nodes: [
      { type: 'tool', label: 'Tool', description: 'Execute tool', icon: Wrench },
      { type: 'action', label: 'Action', description: 'Custom action', icon: MousePointer },
      { type: 'http', label: 'HTTP', description: 'API request', icon: Globe },
      { type: 'code', label: 'Code', description: 'Run code', icon: Code },
    ],
  },
  {
    name: 'Logic',
    colour: SPECTRAL.amber,
    nodes: [
      { type: 'conditional', label: 'Conditional', description: 'If/else branch', icon: GitBranch },
      { type: 'logic', label: 'Logic', description: 'Logic gate', icon: Cog },
      { type: 'loop', label: 'Loop', description: 'Iterate items', icon: Repeat },
      {
        type: 'verification',
        label: 'Verify',
        description: 'Human verification',
        icon: CheckCircle,
      },
    ],
  },
  {
    name: 'Data',
    colour: SPECTRAL.cyan,
    nodes: [
      { type: 'knowledge', label: 'Knowledge', description: 'Knowledge base', icon: Database },
    ],
  },
];

interface DraggableNodeProps {
  node: NodeDefinition;
  colour: string;
  index: number;
}

function DraggableNode({ node, colour, index }: DraggableNodeProps) {
  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const Icon = node.icon;

  return (
    <motion.div
      draggable
      onDragStart={(e) => onDragStart(e as unknown as DragEvent, node.type)}
      className="group cursor-grab active:cursor-grabbing"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        duration: DURATIONS.normal,
        ease: EASINGS.outExpo,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="flex items-center gap-3 rounded-sm border-[0.5px] p-3 transition-all duration-300"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backgroundColor: BACKGROUNDS.elevated,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${colour}50`;
          e.currentTarget.style.backgroundColor = `${colour}10`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.backgroundColor = BACKGROUNDS.elevated;
        }}
      >
        {/* Icon with spectral glow on hover */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-sm border-[0.5px] transition-all duration-300"
          style={{
            borderColor: `${colour}30`,
            backgroundColor: `${colour}10`,
          }}
        >
          <Icon className="h-4 w-4 transition-all duration-300" style={{ color: colour }} />
        </div>

        {/* Label and description */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {node.label}
          </p>
          <p className="truncate text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            {node.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function NodePalette() {
  return (
    <motion.div
      className="h-full w-64 overflow-y-auto border-r-[0.5px] border-white/[0.06]"
      style={{ backgroundColor: BACKGROUNDS.primary }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b-[0.5px] border-white/[0.06] bg-[#050505] p-4">
        <h2
          className="text-[10px] tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          Node Palette
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Drag nodes to canvas
        </p>
      </div>

      {/* Node Categories */}
      <div className="space-y-6 p-3">
        {NODE_CATEGORIES.map((category, categoryIndex) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: categoryIndex * 0.1,
              duration: DURATIONS.normal,
              ease: EASINGS.outExpo,
            }}
          >
            {/* Category Header */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.colour }} />
              <span
                className="text-[10px] font-medium tracking-[0.2em] uppercase"
                style={{ color: category.colour }}
              >
                {category.name}
              </span>
            </div>

            {/* Nodes in Category */}
            <div className="space-y-2">
              {category.nodes.map((node, nodeIndex) => (
                <DraggableNode
                  key={node.type}
                  node={node}
                  colour={category.colour}
                  index={nodeIndex}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Hint */}
      <div className="sticky bottom-0 border-t-[0.5px] border-white/[0.06] bg-[#050505] p-4">
        <p className="text-center text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
          Connect nodes by dragging from handles
        </p>
      </div>
    </motion.div>
  );
}
