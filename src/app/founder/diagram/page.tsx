'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ExcalidrawEmbed } from '@/components/nexus/ExcalidrawEmbed';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DiagramPage() {
  const router = useRouter();
  const [pageId, setPageId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Diagram');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [initialElements, setInitialElements] = useState<readonly ExcalidrawElement[] | undefined>(undefined);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementsRef = useRef<readonly ExcalidrawElement[]>([]);

  // Check for existing diagram page or create one
  useEffect(() => {
    async function init() {
      try {
        // Check URL params for existing diagram
        const params = new URLSearchParams(window.location.search);
        const existingId = params.get('id');

        if (existingId) {
          const res = await fetch(`/api/nexus/pages/${existingId}`);
          if (res.ok) {
            const data = await res.json();
            setPageId(existingId);
            setTitle(data.page?.title || 'Untitled Diagram');
            if (data.page?.body?.diagramData?.elements) {
              setInitialElements(data.page.body.diagramData.elements);
            }
          }
        }
      } catch {
        // Start fresh
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const saveDiagram = useCallback(
    async (elements: readonly ExcalidrawElement[]) => {
      setSaveStatus('saving');

      try {
        if (!pageId) {
          // Create new diagram page
          const res = await fetch('/api/nexus/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              page_type: 'diagram',
              icon: '📐',
              body: { diagramData: { elements } },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setPageId(data.page.id);
            // Update URL without navigation
            window.history.replaceState(null, '', `/founder/diagram?id=${data.page.id}`);
          }
        } else {
          // Update existing
          await fetch(`/api/nexus/pages/${pageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              body: { diagramData: { elements } },
            }),
          });
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    [pageId, title],
  );

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], _appState: AppState, _files: BinaryFiles) => {
      elementsRef.current = elements;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDiagram(elements);
      }, 2000);
    },
    [saveDiagram],
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDiagram(elementsRef.current);
    }, 1000);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/nexus/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Describe a diagram for: ${aiPrompt}. List the main shapes, connections, and labels that should be included. Be concise.`,
          mode: 'write',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResult(data.text);
      }
    } catch {
      setAiResult('Failed to generate description. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#00F5FF] font-mono text-sm"
        >
          Loading diagram editor...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0d0d0d]/95 px-4 py-2 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/founder')}
            className="text-[#666] hover:text-[#00F5FF] text-sm font-mono transition-colors"
          >
            NEXUS
          </button>
          <span className="text-[#333]">/</span>
          <span className="text-[#999] text-sm">📐</span>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Diagram"
            className="bg-transparent text-white text-sm font-medium outline-none placeholder-[#333] max-w-[300px]"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <AnimatePresence mode="wait">
            <motion.span
              key={saveStatus}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={`text-xs font-mono ${
                saveStatus === 'saving'
                  ? 'text-[#FFB800]'
                  : saveStatus === 'saved'
                    ? 'text-[#00FF88]'
                    : saveStatus === 'error'
                      ? 'text-[#FF4444]'
                      : 'text-transparent'
              }`}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && '.'}
            </motion.span>
          </AnimatePresence>

          {/* AI Generate button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="rounded-sm px-3 py-1 text-xs font-mono border border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/10 transition-colors"
          >
            AI Generate
          </button>
        </div>
      </div>

      {/* Excalidraw canvas — full remaining height */}
      <div className="flex-1">
        <ExcalidrawEmbed
          initialData={initialElements ? { elements: initialElements } : undefined}
          onChange={handleChange}
          height="100%"
        />
      </div>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAiModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 bg-[#0a0a0a] border border-[#00F5FF]/20 rounded-sm p-6 shadow-2xl"
            >
              <h2 className="font-mono text-[#00F5FF] text-base mb-4">
                AI Diagram Assistant
              </h2>
              <p className="text-xs text-white/40 font-mono mb-4">
                Describe what you want to diagram. AI will generate a description to guide your drawing.
              </p>
              {/* TODO: When Excalidraw supports programmatic element creation via API,
                  convert the AI description into actual Excalidraw elements (shapes, arrows, text).
                  For now, we generate a text description as a drawing guide. */}
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. System architecture with frontend, API gateway, microservices, and database"
                rows={3}
                className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/20 resize-none mb-4"
              />

              {aiResult && (
                <div className="mb-4 p-3 rounded-sm border border-[#00F5FF]/20 bg-[#00F5FF]/5">
                  <p className="text-xs font-mono text-[#00F5FF] mb-1">Diagram guide:</p>
                  <p className="text-xs text-white/70 font-mono whitespace-pre-wrap">{aiResult}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="flex-1 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] font-mono text-sm rounded-sm hover:bg-[#00F5FF]/20 disabled:opacity-50 transition-colors"
                >
                  {aiGenerating ? 'Generating...' : 'Generate Description'}
                </button>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 border border-white/10 text-white/40 font-mono text-sm rounded-sm hover:text-white/70 hover:border-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
