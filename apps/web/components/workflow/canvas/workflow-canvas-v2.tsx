'use client';

/**
 * Workflow Canvas V2 - Scientific Luxury Edition
 *
 * Visual workflow editor using @xyflow/react (React Flow v12)
 * Implements OLED black background, spectral colours, and physics-based animations.
 *
 * @see docs/DESIGN_SYSTEM.md for styling reference
 */

import { useCallback, useRef, useState, DragEvent, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Save, Play, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from 'lucide-react';
import { SPECTRAL, BACKGROUNDS, EASINGS, DURATIONS } from '@/lib/design-tokens';
import { NODE_SPECTRAL_COLOURS, NodeType } from '@/types/workflow';
import type { ExecutionStatus } from '@/hooks/use-workflow-execution';
import type { NodeVisualStatus } from '@/types/workflow';

// Import custom node components
import { WorkflowNodeComponent } from '../nodes/workflow-node';
import { NodePalette } from '../sidebar/node-palette';
import { NodeConfigPanel, type NodeData } from '../config/node-config-panel';
import { NodeContextMenu, type ContextMenuPosition } from '../context-menu/node-context-menu';
import { ExecutionPanel } from '../execution/execution-panel';

// Define node types mapping
const nodeTypes: NodeTypes = {
  start: WorkflowNodeComponent,
  trigger: WorkflowNodeComponent,
  end: WorkflowNodeComponent,
  output: WorkflowNodeComponent,
  llm: WorkflowNodeComponent,
  agent: WorkflowNodeComponent,
  tool: WorkflowNodeComponent,
  action: WorkflowNodeComponent,
  conditional: WorkflowNodeComponent,
  logic: WorkflowNodeComponent,
  loop: WorkflowNodeComponent,
  knowledge: WorkflowNodeComponent,
  http: WorkflowNodeComponent,
  code: WorkflowNodeComponent,
  verification: WorkflowNodeComponent,
};

interface WorkflowCanvasV2Props {
  workflowId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onExecute?: () => Promise<void>;
  readonly?: boolean;
}

function WorkflowCanvasInner({
  workflowId,
  initialNodes = [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: 'Start', nodeType: 'start' },
    },
  ],
  initialEdges = [],
  onSave,
  onExecute,
  readonly = false,
}: WorkflowCanvasV2Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();

  // Node configuration panel state
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Execution panel state
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);

  // Context menu state
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);

  // History for undo/redo (simplified)
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save to history before changes
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, nodes, edges]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      saveToHistory();
      // Add edge with Scientific Luxury styling
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: 'rgba(255, 255, 255, 0.3)',
              strokeWidth: 1,
            },
            markerEnd: {
              type: 'arrowclosed' as const,
              color: 'rgba(255, 255, 255, 0.5)',
            },
          },
          eds
        )
      );
    },
    [setEdges, saveToHistory]
  );

  // Handle node click to open config panel
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const nodeData: NodeData = {
      id: node.id,
      label: node.data.label as string,
      nodeType: node.data.nodeType as NodeType,
      description: node.data.description as string | undefined,
      config: node.data.config as Record<string, unknown> | undefined,
    };
    setSelectedNode(nodeData);
    setIsConfigPanelOpen(true);
  }, []);

  // Handle node double click (also opens config)
  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    const nodeData: NodeData = {
      id: node.id,
      label: node.data.label as string,
      nodeType: node.data.nodeType as NodeType,
      description: node.data.description as string | undefined,
      config: node.data.config as Record<string, unknown> | undefined,
    };
    setSelectedNode(nodeData);
    setIsConfigPanelOpen(true);
  }, []);

  // Handle node right-click context menu
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuNodeId(node.id);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setContextMenuNodeId(null);
  }, []);

  // Update node data from config panel
  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<NodeData>) => {
      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }
          return node;
        })
      );
      // Update selected node state
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? { ...prev, ...data } : null));
      }
    },
    [setNodes, selectedNode, saveToHistory]
  );

  // Delete node
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      saveToHistory();
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        setIsConfigPanelOpen(false);
      }
    },
    [setNodes, setEdges, selectedNode, saveToHistory]
  );

  // Duplicate node
  const handleNodeDuplicate = useCallback(
    (nodeId: string) => {
      saveToHistory();
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (nodeToDuplicate) {
        const newNode: Node = {
          ...nodeToDuplicate,
          id: `${nodeToDuplicate.type}-${Date.now()}`,
          position: {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50,
          },
          data: { ...nodeToDuplicate.data },
          selected: false,
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [nodes, setNodes, saveToHistory]
  );

  // Disconnect all edges from a node
  const handleNodeDisconnect = useCallback(
    (nodeId: string) => {
      saveToHistory();
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setEdges, saveToHistory]
  );

  // Map backend execution status to frontend visual status
  const toVisualStatus = useCallback((status: ExecutionStatus): NodeVisualStatus => {
    switch (status) {
      case 'pending':
        return 'awaiting';
      case 'running':
        return 'running';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'idle';
      default:
        return 'idle';
    }
  }, []);

  // Update node visual status during execution
  const handleNodeStatusChange = useCallback(
    (nodeStatuses: Map<string, ExecutionStatus>) => {
      setNodes((nds) =>
        nds.map((node) => {
          const execStatus = nodeStatuses.get(node.id);
          if (execStatus) {
            const visualStatus = toVisualStatus(execStatus);
            if (node.data.status !== visualStatus) {
              return { ...node, data: { ...node.data, status: visualStatus } };
            }
          }
          return node;
        })
      );
    },
    [setNodes, toVisualStatus]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes
      if ((event.key === 'Delete' || event.key === 'Backspace') && !readonly) {
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          saveToHistory();
          const selectedIds = new Set(selectedNodes.map((n) => n.id));
          setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
          setEdges((eds) =>
            eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target))
          );
        }
      }

      // Undo: Ctrl/Cmd + Z
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
      }

      // Duplicate: Ctrl/Cmd + D
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        const selectedNodes = nodes.filter((n) => n.selected);
        selectedNodes.forEach((node) => handleNodeDuplicate(node.id));
      }

      // Close config panel: Escape
      if (event.key === 'Escape') {
        setIsConfigPanelOpen(false);
        closeContextMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    readonly,
    handleUndo,
    handleRedo,
    handleNodeDuplicate,
    saveToHistory,
    setNodes,
    setEdges,
    closeContextMenu,
  ]);

  // Handle drag and drop from palette
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          nodeType: type,
          status: 'idle',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const handleSave = async () => {
    if (onSave) {
      await onSave(nodes, edges);
    }
  };

  const handleExecute = async () => {
    if (onExecute) {
      await onExecute();
    }
  };

  return (
    <div
      ref={reactFlowWrapper}
      className="flex h-full w-full"
      style={{ backgroundColor: BACKGROUNDS.primary }}
    >
      {/* Node Palette Sidebar */}
      {!readonly && <NodePalette />}

      {/* Main Canvas Area */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readonly ? undefined : onNodesChange}
          onEdgesChange={readonly ? undefined : onEdgesChange}
          onConnect={readonly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={closeContextMenu}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable={!readonly}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          deleteKeyCode={null} // We handle delete ourselves
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 1 },
          }}
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: BACKGROUNDS.primary }}
        >
          {/* Scientific Luxury Background - Dots on OLED black */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255, 255, 255, 0.05)"
          />

          {/* Custom Controls Panel */}
          <Panel position="top-right" className="flex gap-2">
            {/* Undo/Redo Controls */}
            {!readonly && (
              <motion.div
                className="flex gap-1 rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505]/90 p-1 backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo, delay: 0.05 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30"
                  title="Undo (⌘Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30"
                  title="Redo (⌘⇧Z)"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Zoom Controls */}
            <motion.div
              className="flex gap-1 rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505]/90 p-1 backdrop-blur-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomIn()}
                className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomOut()}
                className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fitView()}
                className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white"
                title="Fit View"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </Panel>

          {/* MiniMap with Scientific Luxury colours */}
          <MiniMap
            nodeColor={(node) => {
              const nodeType = node.type as NodeType;
              return NODE_SPECTRAL_COLOURS[nodeType] || SPECTRAL.grey;
            }}
            maskColor="rgba(5, 5, 5, 0.8)"
            style={{
              backgroundColor: BACKGROUNDS.primary,
              border: '0.5px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '2px',
            }}
            className="!border-[0.5px] !border-white/[0.06] !bg-[#050505]"
          />

          {/* Action Panel */}
          {!readonly && (
            <Panel position="bottom-right">
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
              >
                {(workflowId || onExecute) && (
                  <Button
                    onClick={() => {
                      if (workflowId) {
                        setIsExecutionPanelOpen((prev) => !prev);
                      } else if (onExecute) {
                        handleExecute();
                      }
                    }}
                    className={`border-[0.5px] ${
                      isExecutionPanelOpen
                        ? 'border-[#00F5FF]/50 bg-[#00F5FF]/20 text-[#00F5FF]'
                        : 'border-[#00F5FF]/30 bg-[#00F5FF]/10 text-[#00F5FF] hover:bg-[#00F5FF]/20'
                    }`}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isExecutionPanelOpen ? 'Close' : 'Execute'}
                  </Button>
                )}
                {onSave && (
                  <Button
                    onClick={handleSave}
                    className="border-[0.5px] border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                )}
              </motion.div>
            </Panel>
          )}
        </ReactFlow>

        {/* Node Configuration Panel */}
        {!readonly && (
          <NodeConfigPanel
            node={selectedNode}
            isOpen={isConfigPanelOpen}
            onClose={() => setIsConfigPanelOpen(false)}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onDuplicate={handleNodeDuplicate}
          />
        )}

        {/* Node Context Menu */}
        {!readonly && (
          <NodeContextMenu
            position={contextMenuPosition}
            nodeId={contextMenuNodeId}
            onClose={closeContextMenu}
            onConfigure={(nodeId) => {
              const node = nodes.find((n) => n.id === nodeId);
              if (node) {
                const nodeData: NodeData = {
                  id: node.id,
                  label: node.data.label as string,
                  nodeType: node.data.nodeType as NodeType,
                  description: node.data.description as string | undefined,
                  config: node.data.config as Record<string, unknown> | undefined,
                };
                setSelectedNode(nodeData);
                setIsConfigPanelOpen(true);
              }
            }}
            onDuplicate={handleNodeDuplicate}
            onDelete={handleNodeDelete}
            onDisconnect={handleNodeDisconnect}
          />
        )}
      </div>

      {/* Execution Panel — right sidebar */}
      <AnimatePresence>
        {isExecutionPanelOpen && workflowId && (
          <motion.div
            className="h-full w-80 flex-shrink-0"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <ExecutionPanel workflowId={workflowId} onNodeStatusChange={handleNodeStatusChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrap with ReactFlowProvider for hooks access
export function WorkflowCanvasV2(props: WorkflowCanvasV2Props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
