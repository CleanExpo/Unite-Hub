'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Building2,
} from 'lucide-react';

const BUSINESSES = [
  { key: 'DR', label: 'Disaster Recovery', color: '#FF4444' },
  { key: 'RestoreAssist', label: 'RestoreAssist', color: '#00F5FF' },
  { key: 'ATO', label: 'ATO Compliance', color: '#FFB800' },
  { key: 'NRPG', label: 'NRPG', color: '#00FF88' },
  { key: 'Unite-Group', label: 'Unite-Group', color: '#A855F7' },
  { key: 'CARSI', label: 'CARSI', color: '#FF00FF' },
] as const;

type ContentType = 'social' | 'email' | 'blog';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'social', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'blog', label: 'Blog Paragraph' },
];

interface Adaptation {
  business: string;
  content: string;
}

export default function ContentCrossPage() {
  const [sourceBusiness, setSourceBusiness] = useState('');
  const [targetBusinesses, setTargetBusinesses] = useState<string[]>([]);
  const [contentType, setContentType] = useState<ContentType>('social');
  const [sourceContent, setSourceContent] = useState('');
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleTarget = (key: string) => {
    setTargetBusinesses((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const availableTargets = BUSINESSES.filter((b) => b.key !== sourceBusiness);

  const handleAdapt = useCallback(async () => {
    if (!sourceContent.trim() || !sourceBusiness || !targetBusinesses.length) return;

    setLoading(true);
    setError('');
    setAdaptations([]);

    try {
      const res = await fetch('/api/founder/content-cross', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent: sourceContent.trim(),
          sourceBusiness,
          targetBusinesses,
          contentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      setAdaptations(data.adaptations || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sourceContent, sourceBusiness, targetBusinesses, contentType]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getBusinessColor = (key: string) =>
    BUSINESSES.find((b) => b.key === key)?.color || '#666';

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Content Cross-pollination Engine
        </h1>
        <p className="text-sm text-[#888] mt-1">
          Adapt content from one business for use across others. AI preserves the core message while matching each brand&apos;s voice.
        </p>
      </div>

      {/* Source business */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
          Source Business
        </label>
        <div className="flex flex-wrap gap-2">
          {BUSINESSES.map((b) => (
            <button
              key={b.key}
              onClick={() => {
                setSourceBusiness(b.key);
                setTargetBusinesses((prev) => prev.filter((k) => k !== b.key));
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all ${
                sourceBusiness === b.key
                  ? 'text-black'
                  : 'bg-[#111] text-[#888] border border-[#222] hover:border-[#333]'
              }`}
              style={
                sourceBusiness === b.key
                  ? { backgroundColor: b.color }
                  : undefined
              }
            >
              <Building2 className="h-3.5 w-3.5" />
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target businesses */}
      {sourceBusiness && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
            Target Businesses
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTargets.map((b) => {
              const selected = targetBusinesses.includes(b.key);
              return (
                <button
                  key={b.key}
                  onClick={() => toggleTarget(b.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all ${
                    selected
                      ? 'border-2 text-white'
                      : 'bg-[#111] text-[#555] border border-[#222] hover:border-[#333]'
                  }`}
                  style={
                    selected
                      ? { borderColor: b.color, backgroundColor: `${b.color}15` }
                      : undefined
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-sm border ${
                      selected ? 'border-transparent' : 'border-[#333]'
                    }`}
                    style={selected ? { backgroundColor: b.color } : undefined}
                  />
                  {b.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Content type */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
          Content Type
        </label>
        <div className="flex gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setContentType(ct.value)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                contentType === ct.value
                  ? 'bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30'
                  : 'bg-[#111] text-[#666] border border-[#222] hover:border-[#333]'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source content */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
          Source Content
        </label>
        <textarea
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          placeholder={`Paste or write the ${contentType} content from ${sourceBusiness || 'your source business'}...`}
          rows={6}
          className="w-full bg-[#0a0a0a] border border-[#222] rounded-sm px-4 py-3 text-white text-sm placeholder:text-[#333] focus:outline-none focus:border-[#00F5FF] focus:ring-1 focus:ring-[#00F5FF]/30 resize-none"
        />
      </div>

      {/* Adapt button */}
      <button
        onClick={handleAdapt}
        disabled={
          loading ||
          !sourceContent.trim() ||
          !sourceBusiness ||
          !targetBusinesses.length
        }
        className="flex items-center gap-2 px-6 py-3 bg-[#00F5FF] text-black rounded-sm font-bold text-sm hover:bg-[#00F5FF]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adapting...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Adapt for {targetBusinesses.length} business
            {targetBusinesses.length !== 1 ? 'es' : ''}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm px-4 py-3 text-sm text-[#FF4444]">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {adaptations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-[#666] uppercase tracking-wider">
              Adapted Content
            </h2>
            {adaptations.map((a, i) => (
              <motion.div
                key={a.business}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="bg-[#0a0a0a] border border-[#222] rounded-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: getBusinessColor(a.business) }}
                    />
                    <span className="text-sm font-medium text-white">
                      {BUSINESSES.find((b) => b.key === a.business)?.label || a.business}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111] border border-[#222] text-[#555]">
                      {contentType}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(a.content, i)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-sm transition-colors text-[#666] hover:text-[#00F5FF] hover:bg-[#00F5FF]/5"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="h-3 w-3 text-[#00FF88]" />
                        <span className="text-[#00FF88]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Card content */}
                <div className="px-4 py-3">
                  <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">
                    {a.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
