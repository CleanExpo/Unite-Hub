'use client';

/**
 * Node Configuration Panel - Scientific Luxury Edition
 *
 * Sliding panel for configuring workflow nodes.
 * Implements OLED black theme, spectral colours, and physics-based animations.
 *
 * @see docs/DESIGN_SYSTEM.md for styling reference
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SPECTRAL, BACKGROUNDS, EASINGS, DURATIONS } from '@/lib/design-tokens';
import { NODE_SPECTRAL_COLOURS, type NodeType } from '@/types/workflow';

// Node-specific config components
import { LLMNodeConfig } from './node-configs/llm-config';
import { AgentNodeConfig } from './node-configs/agent-config';
import { HttpNodeConfig } from './node-configs/http-config';
import { CodeNodeConfig } from './node-configs/code-config';
import { ConditionalNodeConfig } from './node-configs/conditional-config';
import { LoopNodeConfig } from './node-configs/loop-config';
import { ToolNodeConfig } from './node-configs/tool-config';

export interface NodeData {
  id: string;
  label: string;
  nodeType: NodeType;
  description?: string;
  config?: Record<string, unknown>;
}

interface NodeConfigPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}

// Map node types to their configuration components
const NODE_CONFIG_COMPONENTS: Partial<Record<NodeType, React.ComponentType<NodeConfigProps>>> = {
  llm: LLMNodeConfig,
  agent: AgentNodeConfig,
  http: HttpNodeConfig,
  code: CodeNodeConfig,
  conditional: ConditionalNodeConfig,
  loop: LoopNodeConfig,
  tool: ToolNodeConfig,
};

export interface NodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

function NodeConfigPanelInner({
  node,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: NodeConfigPanelProps) {
  const colour = node ? NODE_SPECTRAL_COLOURS[node.nodeType] || SPECTRAL.grey : SPECTRAL.grey;

  const handleLabelChange = useCallback(
    (value: string) => {
      if (node) {
        onUpdate(node.id, { label: value });
      }
    },
    [node, onUpdate]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      if (node) {
        onUpdate(node.id, { description: value });
      }
    },
    [node, onUpdate]
  );

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      if (node) {
        onUpdate(node.id, { config });
      }
    },
    [node, onUpdate]
  );

  const handleDelete = useCallback(() => {
    if (node) {
      onDelete(node.id);
      onClose();
    }
  }, [node, onDelete, onClose]);

  const handleDuplicate = useCallback(() => {
    if (node) {
      onDuplicate(node.id);
    }
  }, [node, onDuplicate]);

  const ConfigComponent = node ? NODE_CONFIG_COMPONENTS[node.nodeType] : null;

  return (
    <AnimatePresence>
      {isOpen && node && (
        <motion.div
          className="absolute top-0 right-0 z-30 h-full w-96 overflow-y-auto border-l-[0.5px] border-white/[0.06]"
          style={{ backgroundColor: BACKGROUNDS.primary }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 border-b-[0.5px] border-white/[0.06] p-4"
            style={{
              backgroundColor: BACKGROUNDS.primary,
              background: `linear-gradient(135deg, ${colour}08 0%, ${BACKGROUNDS.primary} 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-sm border-[0.5px]"
                  style={{
                    borderColor: `${colour}30`,
                    backgroundColor: `${colour}10`,
                  }}
                  animate={{
                    boxShadow: [`0 0 0 ${colour}00`, `0 0 15px ${colour}30`, `0 0 0 ${colour}00`],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Settings2 className="h-5 w-5" style={{ color: colour }} />
                </motion.div>
                <div>
                  <h3 className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Configure Node
                  </h3>
                  <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: colour }}>
                    {node.nodeType}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-white/30 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white"
              >
                <Copy className="mr-2 h-3 w-3" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="flex-1 border-[0.5px] border-[#FF4444]/20 bg-[#FF4444]/5 text-[#FF4444]/70 hover:bg-[#FF4444]/10 hover:text-[#FF4444]"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList
                className="w-full border-[0.5px] border-white/[0.06] bg-white/[0.02]"
                style={{ backgroundColor: BACKGROUNDS.elevated }}
              >
                <TabsTrigger
                  value="general"
                  className="flex-1 text-white/50 data-[state=active]:bg-white/5 data-[state=active]:text-white"
                >
                  General
                </TabsTrigger>
                {ConfigComponent && (
                  <TabsTrigger
                    value="config"
                    className="flex-1 text-white/50 data-[state=active]:bg-white/5 data-[state=active]:text-white"
                  >
                    Configuration
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="advanced"
                  className="flex-1 text-white/50 data-[state=active]:bg-white/5 data-[state=active]:text-white"
                >
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-4 space-y-4">
                <div>
                  <Label
                    htmlFor="node-label"
                    className="text-[10px] tracking-[0.2em] text-white/40 uppercase"
                  >
                    Label
                  </Label>
                  <Input
                    id="node-label"
                    value={node.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="Node label"
                    className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90 placeholder:text-white/30 focus:border-white/20"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="node-description"
                    className="text-[10px] tracking-[0.2em] text-white/40 uppercase"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="node-description"
                    value={node.description || ''}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe what this node does"
                    rows={3}
                    className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90 placeholder:text-white/30 focus:border-white/20"
                  />
                </div>

                <div className="rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">Node ID</p>
                  <p className="mt-1 font-mono text-xs text-white/50">{node.id}</p>
                </div>
              </TabsContent>

              {/* Configuration Tab (Node-specific) */}
              {ConfigComponent && (
                <TabsContent value="config" className="mt-4">
                  <ConfigComponent config={node.config || {}} onChange={handleConfigChange} />
                </TabsContent>
              )}

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="mt-4 space-y-4">
                <div className="rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                    Execution Settings
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">Timeout (seconds)</span>
                      <Input
                        type="number"
                        defaultValue={30}
                        className="w-20 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-right text-white/90"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">Retry count</span>
                      <Input
                        type="number"
                        defaultValue={0}
                        className="w-20 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-right text-white/90"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border-[0.5px] border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                    Error Handling
                  </p>
                  <div className="mt-3">
                    <select
                      className="w-full rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] px-3 py-2 text-sm text-white/90"
                      defaultValue="fail"
                    >
                      <option value="fail">Fail workflow</option>
                      <option value="skip">Skip and continue</option>
                      <option value="retry">Retry with backoff</option>
                      <option value="fallback">Use fallback value</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const NodeConfigPanel = memo(NodeConfigPanelInner);
