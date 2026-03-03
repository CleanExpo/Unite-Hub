/**
 * Yjs WebSocket Provider - Real-time Collaboration
 *
 * CRDT-based real-time collaboration for workflow editing.
 * Uses Yjs for conflict-free document synchronisation.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Node, Edge } from '@xyflow/react';

// Default WebSocket server URL (can be overridden via environment)
const WS_SERVER_URL = process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:1234';

export interface CollaboratorInfo {
  id: string;
  name: string;
  colour: string;
  cursor?: { x: number; y: number };
  selectedNodes?: string[];
}

export interface YjsProviderConfig {
  workflowId: string;
  userId: string;
  userName: string;
  userColour?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSynced?: () => void;
  onCollaboratorsChange?: (collaborators: CollaboratorInfo[]) => void;
}

// Spectral colours for collaborators (Scientific Luxury palette)
const COLLABORATOR_COLOURS = [
  '#00F5FF', // Cyan
  '#FF00FF', // Magenta
  '#00FF88', // Emerald
  '#FFB800', // Amber
  '#FF4444', // Red
  '#8B5CF6', // Purple
  '#F472B6', // Pink
  '#34D399', // Teal
];

/**
 * Get a consistent colour for a user based on their ID
 */
function getCollaboratorColour(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return COLLABORATOR_COLOURS[Math.abs(hash) % COLLABORATOR_COLOURS.length];
}

/**
 * Create a Yjs provider for workflow collaboration
 */
export function createYjsProvider(config: YjsProviderConfig) {
  const {
    workflowId,
    userId,
    userName,
    userColour,
    onConnect,
    onDisconnect,
    onSynced,
    onCollaboratorsChange,
  } = config;

  // Create Yjs document
  const ydoc = new Y.Doc();

  // Create shared types for workflow data
  const yNodes = ydoc.getArray<Node>('nodes');
  const yEdges = ydoc.getArray<Edge>('edges');
  const yMeta = ydoc.getMap('meta');

  // Room name based on workflow ID
  const roomName = `workflow-${workflowId}`;

  // Create WebSocket provider
  const wsProvider = new WebsocketProvider(WS_SERVER_URL, roomName, ydoc, {
    connect: true,
  });

  // Set up awareness for presence/cursors
  const awareness = wsProvider.awareness;

  // Set local user state
  const colour = userColour || getCollaboratorColour(userId);
  awareness.setLocalState({
    id: userId,
    name: userName,
    colour,
    cursor: null,
    selectedNodes: [],
  });

  // Track collaborators
  const updateCollaborators = () => {
    const states = awareness.getStates();
    const collaborators: CollaboratorInfo[] = [];

    states.forEach((state, clientId) => {
      if (state && clientId !== awareness.clientID) {
        collaborators.push({
          id: state.id || `user-${clientId}`,
          name: state.name || 'Anonymous',
          colour: state.colour || '#6B7280',
          cursor: state.cursor,
          selectedNodes: state.selectedNodes,
        });
      }
    });

    onCollaboratorsChange?.(collaborators);
  };

  // Listen for awareness changes
  awareness.on('change', updateCollaborators);

  // Connection status handlers
  wsProvider.on('status', (event: { status: string }) => {
    if (event.status === 'connected') {
      onConnect?.();
    } else if (event.status === 'disconnected') {
      onDisconnect?.();
    }
  });

  wsProvider.on('sync', (isSynced: boolean) => {
    if (isSynced) {
      onSynced?.();
    }
  });

  // Return provider interface
  return {
    ydoc,
    yNodes,
    yEdges,
    yMeta,
    wsProvider,
    awareness,

    /**
     * Update local cursor position
     */
    updateCursor(x: number, y: number) {
      const state = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...state,
        cursor: { x, y },
      });
    },

    /**
     * Clear cursor (e.g., when mouse leaves canvas)
     */
    clearCursor() {
      const state = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...state,
        cursor: null,
      });
    },

    /**
     * Update selected nodes
     */
    updateSelectedNodes(nodeIds: string[]) {
      const state = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...state,
        selectedNodes: nodeIds,
      });
    },

    /**
     * Sync nodes from React Flow to Yjs
     */
    syncNodes(nodes: Node[]) {
      ydoc.transact(() => {
        yNodes.delete(0, yNodes.length);
        yNodes.push(nodes);
      });
    },

    /**
     * Sync edges from React Flow to Yjs
     */
    syncEdges(edges: Edge[]) {
      ydoc.transact(() => {
        yEdges.delete(0, yEdges.length);
        yEdges.push(edges);
      });
    },

    /**
     * Get current nodes from Yjs
     */
    getNodes(): Node[] {
      return yNodes.toArray();
    },

    /**
     * Get current edges from Yjs
     */
    getEdges(): Edge[] {
      return yEdges.toArray();
    },

    /**
     * Subscribe to node changes
     */
    onNodesChange(callback: (nodes: Node[]) => void) {
      const observer = () => {
        callback(yNodes.toArray());
      };
      yNodes.observe(observer);
      return () => yNodes.unobserve(observer);
    },

    /**
     * Subscribe to edge changes
     */
    onEdgesChange(callback: (edges: Edge[]) => void) {
      const observer = () => {
        callback(yEdges.toArray());
      };
      yEdges.observe(observer);
      return () => yEdges.unobserve(observer);
    },

    /**
     * Disconnect and cleanup
     */
    destroy() {
      awareness.off('change', updateCollaborators);
      wsProvider.disconnect();
      ydoc.destroy();
    },

    /**
     * Check if connected
     */
    get isConnected() {
      return wsProvider.wsconnected;
    },

    /**
     * Get local user colour
     */
    get localColour() {
      return colour;
    },
  };
}

export type YjsProvider = ReturnType<typeof createYjsProvider>;
