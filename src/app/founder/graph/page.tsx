'use client';

/**
 * /founder/graph — Knowledge Graph view
 *
 * Full-screen ReactFlow graph of contacts and businesses.
 * Scientific Luxury design: #050505 bg, #00F5FF cyan, #00FF88 emerald, Framer Motion.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Node, type Edge } from 'reactflow';
import { X, Network, Users, Building2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import KnowledgeGraph to avoid SSR issues with ReactFlow
const KnowledgeGraph = dynamic(
  () => import('@/components/founder/KnowledgeGraph').then((m) => m.KnowledgeGraph),
  { ssr: false, loading: () => <GraphLoadingState /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  meta: {
    contactCount: number;
    businessCount: number;
  };
}

interface SelectedNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function GraphLoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#050505',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#00F5FF',
        fontSize: '13px',
        letterSpacing: '0.08em',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid #00F5FF33',
            borderTop: '2px solid #00F5FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span>INITIALISING GRAPH</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: SelectedNode;
  onClose: () => void;
}) {
  const isContact = node.type === 'contact';
  const accentColour = isContact ? '#00F5FF' : '#00FF88';
  const name = (node.data.label as string) ?? 'Unknown';
  const encodedName = encodeURIComponent(name);
  const obsidianBase = 'obsidian://open?vault=Unite-Group+Vault';
  const obsidianLink = isContact
    ? `${obsidianBase}&file=Contacts/${encodedName}`
    : `${obsidianBase}&file=Businesses/${encodedName}`;

  const tags = (node.data.tags as string[]) ?? [];
  const status = node.data.status as string | undefined;
  const company = node.data.business as string | undefined;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '100%',
        background: '#0d0d0d',
        borderLeft: `1px solid ${accentColour}33`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'JetBrains Mono, monospace',
        zIndex: 20,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${accentColour}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isContact ? (
            <Users size={14} color={accentColour} />
          ) : (
            <Building2 size={14} color={accentColour} />
          )}
          <span
            style={{
              fontSize: '10px',
              color: accentColour,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {isContact ? 'Contact' : 'Business'}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '2px',
            transition: 'color 0.15s',
          }}
          aria-label="Close panel"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#fff')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#555')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel body */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        {/* Name */}
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: accentColour,
            marginBottom: '16px',
            letterSpacing: '0.02em',
            lineHeight: 1.3,
          }}
        >
          {name}
        </h2>

        {/* Contact-specific fields */}
        {isContact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {company && (
              <DetailRow label="Company" value={company} />
            )}
            {status && (
              <DetailRow label="Status" value={status} accentColour={accentColour} />
            )}
            {tags.length > 0 && (
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Tags
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        background: '#00F5FF11',
                        border: '1px solid #00F5FF33',
                        borderRadius: '2px',
                        fontSize: '10px',
                        color: '#00F5FF',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Obsidian link */}
      <div
        style={{
          padding: '16px',
          borderTop: `1px solid ${accentColour}22`,
        }}
      >
        <a
          href={obsidianLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: `${accentColour}11`,
            border: `1px solid ${accentColour}33`,
            borderRadius: '2px',
            color: accentColour,
            fontSize: '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = `${accentColour}22`;
            (e.currentTarget as HTMLAnchorElement).style.borderColor = `${accentColour}66`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = `${accentColour}11`;
            (e.currentTarget as HTMLAnchorElement).style.borderColor = `${accentColour}33`;
          }}
        >
          Open in Obsidian
        </a>
      </div>
    </motion.div>
  );
}

function DetailRow({
  label,
  value,
  accentColour,
}: {
  label: string;
  value: string;
  accentColour?: string;
}) {
  return (
    <div>
      <span
        style={{
          fontSize: '10px',
          color: '#555',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'block',
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: accentColour ?? '#ccc',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Filter Controls ──────────────────────────────────────────────────────────

function FilterControls({
  showContacts,
  showBusinesses,
  onToggleContacts,
  onToggleBusinesses,
}: {
  showContacts: boolean;
  showBusinesses: boolean;
  onToggleContacts: () => void;
  onToggleBusinesses: () => void;
}) {
  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: '1px solid',
    borderRadius: '2px',
    fontSize: '10px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: 'none',
    fontFamily: 'JetBrains Mono, monospace',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        style={{
          ...btnBase,
          borderColor: showContacts ? '#00F5FF55' : '#33333355',
          color: showContacts ? '#00F5FF' : '#555',
          background: showContacts ? '#00F5FF11' : 'transparent',
        }}
        onClick={onToggleContacts}
        aria-pressed={showContacts}
      >
        <Users size={12} />
        Contacts
      </button>
      <button
        style={{
          ...btnBase,
          borderColor: showBusinesses ? '#00FF8855' : '#33333355',
          color: showBusinesses ? '#00FF88' : '#555',
          background: showBusinesses ? '#00FF8811' : 'transparent',
        }}
        onClick={onToggleBusinesses}
        aria-pressed={showBusinesses}
      >
        <Building2 size={12} />
        Businesses
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [showContacts, setShowContacts] = useState(true);
  const [showBusinesses, setShowBusinesses] = useState(true);

  // ── Fetch graph data ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchGraph() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/founder/graph/data');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data: GraphData = await res.json();
        setGraphData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load graph';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
  }, []);

  // ── Filter nodes/edges ──────────────────────────────────────────────────────
  const filteredNodes = React.useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((n) => {
      if (n.type === 'contact') return showContacts;
      if (n.type === 'business') return showBusinesses;
      return true;
    });
  }, [graphData, showContacts, showBusinesses]);

  const filteredEdges = React.useMemo(() => {
    if (!graphData) return [];
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [graphData, filteredNodes]);

  const handleNodeClick = (
    nodeId: string,
    nodeType: string,
    data: Record<string, unknown>
  ) => {
    setSelectedNode({ id: nodeId, type: nodeType, data });
  };

  const closePanel = () => setSelectedNode(null);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100vh',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: '56px',
          borderBottom: '1px solid #00F5FF1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: '#080808',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={18} color="#00F5FF" />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#00F5FF',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Knowledge Graph
          </span>
          {graphData && (
            <span
              style={{
                fontSize: '11px',
                color: '#555',
                borderLeft: '1px solid #222',
                paddingLeft: '10px',
                marginLeft: '2px',
              }}
            >
              {graphData.meta.contactCount} contacts · {graphData.meta.businessCount} businesses ·{' '}
              {filteredEdges.length} edges
            </span>
          )}
        </div>

        {/* Filter controls */}
        <FilterControls
          showContacts={showContacts}
          showBusinesses={showBusinesses}
          onToggleContacts={() => setShowContacts((v) => !v)}
          onToggleBusinesses={() => setShowBusinesses((v) => !v)}
        />
      </div>

      {/* ── Graph area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '2px solid #00F5FF22',
                  borderTop: '2px solid #00F5FF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ fontSize: '11px', color: '#00F5FF99', letterSpacing: '0.1em' }}>
                LOADING GRAPH
              </span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
              zIndex: 30,
            }}
          >
            <div
              style={{
                background: '#FF444411',
                border: '1px solid #FF444433',
                borderRadius: '2px',
                padding: '20px 28px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#FF4444', fontSize: '12px', marginBottom: '8px' }}>
                Failed to load graph
              </p>
              <p style={{ color: '#555', fontSize: '11px' }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && graphData && (
          <KnowledgeGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* ── Detail panel ── */}
        <AnimatePresence>
          {selectedNode && (
            <NodeDetailPanel node={selectedNode} onClose={closePanel} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
