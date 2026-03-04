'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

const BUSINESSES = [
  { value: '', label: 'Select business context...' },
  { value: 'DR', label: 'Disaster Recovery (DR)' },
  { value: 'RestoreAssist', label: 'RestoreAssist' },
  { value: 'ATO', label: 'ATO Compliance' },
  { value: 'NRPG', label: 'NRPG' },
  { value: 'Unite-Group', label: 'Unite-Group' },
  { value: 'CARSI', label: 'CARSI' },
  { value: 'All', label: 'All Businesses' },
];

type Phase = 'idle' | 'thinking' | 'streaming' | 'done' | 'error';

export function DeepThinkTab() {
  const [question, setQuestion] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || phase === 'thinking' || phase === 'streaming') return;

    setPhase('thinking');
    setResponse('');
    setErrorMsg('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/founder/strategy/deep-think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          businessContext: businessContext || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Detect phase markers
        if (buffer.includes('__TEXT_START__')) {
          setPhase('streaming');
          // Remove markers from display
          buffer = buffer
            .replace('__THINKING_START__\n', '')
            .replace('\n__TEXT_START__\n', '');
        }

        // Clean display text
        const displayText = buffer
          .replace('__THINKING_START__\n', '')
          .replace('\n__TEXT_START__\n', '');

        setResponse(displayText);

        // Auto-scroll
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }

      setPhase('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPhase('idle');
        return;
      }
      setErrorMsg((err as Error).message || 'Unknown error');
      setPhase('error');
    }
  }, [question, businessContext, phase]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
  }, []);

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-sm p-6">
        <label className="block text-sm font-medium text-[#888] mb-2">
          What strategic question do you want to think through deeply?
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Should we acquire a competitor in the restoration space, or double down on RestoreAssist SaaS growth?"
          rows={4}
          disabled={phase === 'thinking' || phase === 'streaming'}
          className="w-full bg-[#111] border border-[#222] rounded-sm px-4 py-3 text-white placeholder:text-[#444] focus:outline-none focus:border-[#00F5FF] focus:ring-1 focus:ring-[#00F5FF]/30 resize-none font-mono text-sm disabled:opacity-50"
        />

        <div className="flex items-center gap-4 mt-4">
          {/* Business context selector */}
          <select
            value={businessContext}
            onChange={(e) => setBusinessContext(e.target.value)}
            disabled={phase === 'thinking' || phase === 'streaming'}
            className="bg-[#111] border border-[#222] rounded-sm px-3 py-2 text-sm text-[#ccc] focus:outline-none focus:border-[#00F5FF] disabled:opacity-50"
          >
            {BUSINESSES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Submit / Cancel */}
          {phase === 'thinking' || phase === 'streaming' ? (
            <button
              onClick={handleCancel}
              className="ml-auto flex items-center gap-2 px-5 py-2 bg-[#222] text-[#999] rounded-sm text-sm font-medium hover:bg-[#333] transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!question.trim()}
              className="ml-auto flex items-center gap-2 px-5 py-2 bg-[#FFB800] text-black rounded-sm text-sm font-bold hover:bg-[#FFB800]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Brain className="w-4 h-4" />
              Think Deeply
            </button>
          )}
        </div>

        {/* Cost warning */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-[#555]">
          <AlertTriangle className="w-3 h-3 text-[#FFB800]" />
          ~0.15 AUD per request — use for important decisions
        </div>
      </div>

      {/* Response area */}
      <AnimatePresence mode="wait">
        {phase !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a0a0a] border border-[#222] rounded-sm overflow-hidden"
          >
            {/* Status badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a1a1a]">
              {phase === 'thinking' && (
                <>
                  <Loader2 className="w-4 h-4 text-[#FFB800] animate-spin" />
                  <span className="text-xs font-medium text-[#FFB800]">
                    Extended Thinking...
                  </span>
                  <span className="text-[10px] text-[#444] ml-auto">
                    Claude Opus 4.6
                  </span>
                </>
              )}
              {phase === 'streaming' && (
                <>
                  <Sparkles className="w-4 h-4 text-[#00F5FF]" />
                  <span className="text-xs font-medium text-[#00F5FF]">
                    Analysis
                  </span>
                  <span className="text-[10px] text-[#444] ml-auto">
                    Claude Opus 4.6
                  </span>
                </>
              )}
              {phase === 'done' && (
                <>
                  <Sparkles className="w-4 h-4 text-[#00FF88]" />
                  <span className="text-xs font-medium text-[#00FF88]">
                    Analysis Complete
                  </span>
                </>
              )}
              {phase === 'error' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#FF4444]" />
                  <span className="text-xs font-medium text-[#FF4444]">
                    Error
                  </span>
                </>
              )}
            </div>

            {/* Content */}
            <div
              ref={responseRef}
              className="px-6 py-4 max-h-[600px] overflow-y-auto"
            >
              {phase === 'error' ? (
                <p className="text-sm text-[#FF4444]">{errorMsg}</p>
              ) : response ? (
                <div className="prose prose-invert prose-sm max-w-none font-mono text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">
                  {response}
                  {(phase === 'thinking' || phase === 'streaming') && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-[#00F5FF] ml-0.5 align-middle"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
