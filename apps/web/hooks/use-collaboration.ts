'use client';

/**
 * useCollaboration Hook - Real-time Workflow Collaboration
 *
 * React hook for managing Yjs-based real-time collaboration
 * in the workflow editor.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  createYjsProvider,
  type YjsProvider,
  type CollaboratorInfo,
} from '@/lib/collaboration/yjs-provider';

export interface UseCollaborationConfig {
  workflowId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export interface UseCollaborationReturn {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: CollaboratorInfo[];
  localColour: string;
  updateCursor: (x: number, y: number) => void;
  clearCursor: () => void;
  updateSelectedNodes: (nodeIds: string[]) => void;
  syncNodes: (nodes: Node[]) => void;
  syncEdges: (edges: Edge[]) => void;
}

/**
 * Hook for real-time collaboration in workflow editing
 */
export function useCollaboration(config: UseCollaborationConfig): UseCollaborationReturn {
  const {
    workflowId,
    userId,
    userName,
    enabled = true,
    initialNodes = [],
    initialEdges = [],
    onNodesChange,
    onEdgesChange,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [localColour, setLocalColour] = useState('#00F5FF');

  const providerRef = useRef<YjsProvider | null>(null);
  const isInitialSyncRef = useRef(true);

  // Initialize provider
  useEffect(() => {
    if (!enabled || !workflowId || !userId) {
      return;
    }

    const provider = createYjsProvider({
      workflowId,
      userId,
      userName,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onSynced: () => {
        setIsSynced(true);

        // On initial sync, check if we need to populate from initial data
        if (isInitialSyncRef.current) {
          isInitialSyncRef.current = false;
          const existingNodes = provider.getNodes();
          const existingEdges = provider.getEdges();

          // If no data in Yjs, push initial data
          if (existingNodes.length === 0 && initialNodes.length > 0) {
            provider.syncNodes(initialNodes);
          }
          if (existingEdges.length === 0 && initialEdges.length > 0) {
            provider.syncEdges(initialEdges);
          }

          // Notify parent of current state
          if (existingNodes.length > 0) {
            onNodesChange?.(existingNodes);
          }
          if (existingEdges.length > 0) {
            onEdgesChange?.(existingEdges);
          }
        }
      },
      onCollaboratorsChange: setCollaborators,
    });

    providerRef.current = provider;
    setLocalColour(provider.localColour);

    // Subscribe to changes
    const unsubNodes = provider.onNodesChange((nodes) => {
      onNodesChange?.(nodes);
    });

    const unsubEdges = provider.onEdgesChange((edges) => {
      onEdgesChange?.(edges);
    });

    return () => {
      unsubNodes();
      unsubEdges();
      provider.destroy();
      providerRef.current = null;
      setIsConnected(false);
      setIsSynced(false);
      setCollaborators([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally excluding initialNodes/Edges/callbacks to avoid re-syncing
  }, [workflowId, userId, userName, enabled]);

  // Update cursor position
  const updateCursor = useCallback((x: number, y: number) => {
    providerRef.current?.updateCursor(x, y);
  }, []);

  // Clear cursor
  const clearCursor = useCallback(() => {
    providerRef.current?.clearCursor();
  }, []);

  // Update selected nodes
  const updateSelectedNodes = useCallback((nodeIds: string[]) => {
    providerRef.current?.updateSelectedNodes(nodeIds);
  }, []);

  // Sync nodes to Yjs
  const syncNodes = useCallback((nodes: Node[]) => {
    providerRef.current?.syncNodes(nodes);
  }, []);

  // Sync edges to Yjs
  const syncEdges = useCallback((edges: Edge[]) => {
    providerRef.current?.syncEdges(edges);
  }, []);

  return {
    isConnected,
    isSynced,
    collaborators,
    localColour,
    updateCursor,
    clearCursor,
    updateSelectedNodes,
    syncNodes,
    syncEdges,
  };
}
