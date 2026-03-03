'use client';

/**
 * Workflow Editor Page - Scientific Luxury Edition
 *
 * Full-featured workflow editor with OLED black theme,
 * spectral colours, and physics-based animations.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WorkflowCanvasV2 } from '@/components/workflow/canvas/workflow-canvas-v2';
import { CollaborativeCanvas } from '@/components/workflow/canvas/collaborative-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Settings, X, Clock, GitBranch } from 'lucide-react';
import type { WorkflowDefinition } from '@/types/workflow';
import type { Node, Edge } from '@xyflow/react';
import Link from 'next/link';
import { BACKGROUNDS, SPECTRAL, EASINGS, DURATIONS } from '@/lib/design-tokens';
import { formatAustralianDateTime } from '@/types/workflow';
import { useAuth } from '@/hooks/use-auth';

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const { user: authUser } = useAuth();

  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (workflowId && workflowId !== 'new') {
        try {
          const response = await fetch(`/api/workflows/${workflowId}`);
          if (response.ok) {
            const data = await response.json();
            setWorkflow(data);
            setName(data.name);
            setDescription(data.description || '');
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to fetch workflow:', error);
          }
        } finally {
          setLoading(false);
        }
      } else {
        // New workflow
        setWorkflow({
          id: '',
          name: 'Untitled Workflow',
          description: '',
          version: '1.0.0',
          nodes: [],
          edges: [],
          variables: {},
          skill_compatibility: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: [],
          is_published: false,
        });
        setName('Untitled Workflow');
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId]);

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!workflow) return;

    setIsSaving(true);

    const workflowData = {
      name,
      description,
      tags: workflow.tags,
      variables: workflow.variables,
      nodes: nodes.map((node) => ({
        type: node.type,
        label: node.data.label,
        description: node.data.description || '',
        position: { x: node.position.x, y: node.position.y },
        config: node.data.config || {},
        inputs: {},
        outputs: {},
      })),
      edges: edges.map((edge) => ({
        source_node_id: edge.source,
        target_node_id: edge.target,
        source_handle: edge.sourceHandle || null,
        target_handle: edge.targetHandle || null,
        type: 'default',
        condition: null,
      })),
    };

    try {
      const url = workflowId === 'new' ? '/api/workflows' : `/api/workflows/${workflowId}`;

      const method = workflowId === 'new' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflow(data);

        if (workflowId === 'new') {
          router.push(`/workflows/${data.id}`);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save workflow:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: BACKGROUNDS.primary }}
      >
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Breathing loader orb */}
          <motion.div
            className="mx-auto h-16 w-16 rounded-full border-[0.5px]"
            style={{
              borderColor: `${SPECTRAL.cyan}50`,
              backgroundColor: `${SPECTRAL.cyan}10`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                `0 0 0 ${SPECTRAL.cyan}00`,
                `0 0 30px ${SPECTRAL.cyan}40`,
                `0 0 0 ${SPECTRAL.cyan}00`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <p
            className="mt-6 text-[10px] tracking-[0.3em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Loading workflow
          </p>
        </motion.div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: BACKGROUNDS.primary }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 text-2xl font-light" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Workflow not found
          </h2>
          <Link href="/workflows">
            <Button className="border-[0.5px] border-white/10 bg-white/5 text-white/70 hover:bg-white/10">
              Back to Workflows
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Convert workflow nodes/edges to React Flow format
  const initialNodes: Node[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      nodeType: node.type,
      description: node.description,
      status: 'idle',
    },
  }));

  const initialEdges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    sourceHandle: edge.source_handle || undefined,
    targetHandle: edge.target_handle || undefined,
    animated: true,
    style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 1 },
  }));

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: BACKGROUNDS.primary }}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between border-b-[0.5px] border-white/[0.06] px-4 py-3"
        style={{ backgroundColor: BACKGROUNDS.primary }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
      >
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 border-none bg-transparent px-0 text-lg font-medium text-white/90 placeholder:text-white/30 focus-visible:ring-0"
              placeholder="Workflow name"
            />
            <div
              className="flex items-center gap-4 text-[10px]"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {workflow.nodes.length} nodes
              </span>
              <span>{workflow.edges.length} connections</span>
              {workflow.updated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatAustralianDateTime(workflow.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-[10px] tracking-wider uppercase" style={{ color: SPECTRAL.cyan }}>
              Saving...
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-8 w-8 text-white/50 hover:bg-white/5 hover:text-white ${
              showSettings ? 'bg-white/5 text-white' : ''
            }`}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            className="absolute top-0 right-0 z-20 h-full w-80 overflow-y-auto border-l-[0.5px] border-white/[0.06]"
            style={{ backgroundColor: BACKGROUNDS.primary }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
          >
            <div className="p-4">
              <div className="mb-6 flex items-center justify-between">
                <h3
                  className="text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  Settings
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-6 w-6 text-white/30 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-[10px] tracking-[0.2em] text-white/40 uppercase"
                  >
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Workflow name"
                    className="mt-2 border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90 placeholder:text-white/30 focus:border-white/20"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="description"
                    className="text-[10px] tracking-[0.2em] text-white/40 uppercase"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this workflow does"
                    rows={4}
                    className="mt-2 resize-none border-[0.5px] border-white/[0.06] bg-white/[0.02] text-white/90 placeholder:text-white/30 focus:border-white/20"
                  />
                </div>
                <div>
                  <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                    Version
                  </Label>
                  <p className="mt-2 font-mono text-sm text-white/70">{workflow.version}</p>
                </div>
                {workflow.tags.length > 0 && (
                  <div>
                    <Label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                      Tags
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {workflow.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm border-[0.5px] border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Workflow Canvas */}
        {workflow.id && authUser ? (
          <CollaborativeCanvas
            workflowId={workflow.id}
            userId={authUser.id}
            userName={authUser.email || 'User'}
            initialNodes={initialNodes.length > 0 ? initialNodes : undefined}
            initialEdges={initialEdges}
            onSave={handleSave}
          />
        ) : (
          <WorkflowCanvasV2
            workflowId={workflow.id}
            initialNodes={initialNodes.length > 0 ? initialNodes : undefined}
            initialEdges={initialEdges}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
