"use client";

/**
 * Visual Diff Dashboard
 *
 * Custom visual regression testing dashboard for reviewing
 * Playwright snapshot comparisons. Shows side-by-side, overlay,
 * and slider comparison modes.
 *
 * Route: /dev/visual-diff
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Check,
  AlertTriangle,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Columns,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";

interface Snapshot {
  name: string;
  testName: string;
  viewport: string;
  expectedPath: string;
  actualPath: string | null;
  diffPath: string | null;
  status: "passed" | "changed" | "new" | "missing";
  expectedSize: number;
  actualSize: number | null;
  lastModified: string;
}

interface SnapshotData {
  summary: {
    total: number;
    passed: number;
    changed: number;
    new: number;
    missing: number;
  };
  snapshots: Snapshot[];
  snapshotDirs: string[];
}

type CompareMode = "side-by-side" | "overlay" | "slider";
type FilterStatus = "all" | "passed" | "changed" | "new";

export default function VisualDiffDashboard() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>("side-by-side");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [sliderPosition, setSliderPosition] = useState(50);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visual-snapshots");
      if (!res.ok) {
throw new Error("Failed to fetch snapshots");
}
      const json = await res.json();
      setData(json);

      // Auto-select first changed snapshot, or first snapshot
      if (!selectedSnapshot) {
        const firstChanged = json.snapshots.find((s: Snapshot) => s.status === "changed");
        setSelectedSnapshot(firstChanged || json.snapshots[0] || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedSnapshot]);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const filteredSnapshots = data?.snapshots.filter((s) => {
    if (filterStatus === "all") {
return true;
}
    return s.status === filterStatus;
  }) || [];

  const getImageUrl = (path: string | null) => {
    if (!path) {
return null;
}
    return `/api/visual-snapshots?file=${encodeURIComponent(path)}`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <Check className="h-4 w-4 text-success" />;
      case "changed":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "new":
        return <Plus className="h-4 w-4 text-info" />;
      case "missing":
        return <Minus className="h-4 w-4 text-error" />;
      default:
        return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "border-success/30 bg-success/10";
      case "changed":
        return "border-warning/30 bg-warning/10";
      case "new":
        return "border-info/30 bg-info/10";
      case "missing":
        return "border-error/30 bg-error/10";
      default:
        return "border-border-subtle bg-bg-card";
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Visual Diff Dashboard</h1>
            <p className="text-sm text-text-secondary">
              Playwright visual regression testing
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Summary badges */}
            {data && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  {data.summary.passed} passed
                </span>
                {data.summary.changed > 0 && (
                  <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                    {data.summary.changed} changed
                  </span>
                )}
                {data.summary.new > 0 && (
                  <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
                    {data.summary.new} new
                  </span>
                )}
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={fetchSnapshots}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 p-4 text-error">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-accent-500" />
          </div>
        )}

        {/* Main content */}
        {data && (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Sidebar - Snapshot list */}
            <aside className="space-y-4">
              {/* Filter tabs */}
              <div className="flex gap-1 rounded-lg bg-bg-card p-1">
                {(["all", "changed", "passed", "new"] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      filterStatus === status
                        ? "bg-accent-500 text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {status}
                    {status !== "all" && (
                      <span className="ml-1 opacity-60">
                        ({data.summary[status as keyof typeof data.summary]})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Snapshot list */}
              <div className="space-y-2 overflow-y-auto rounded-lg border border-border-subtle bg-bg-card p-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
                {filteredSnapshots.length === 0 ? (
                  <p className="p-4 text-center text-sm text-text-muted">
                    No snapshots found
                  </p>
                ) : (
                  filteredSnapshots.map((snapshot) => (
                    <button
                      key={snapshot.name}
                      onClick={() => setSelectedSnapshot(snapshot)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedSnapshot?.name === snapshot.name
                          ? "border-accent-500 bg-accent-500/10"
                          : statusColor(snapshot.status) + " hover:border-accent-500/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {snapshot.testName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {snapshot.viewport}
                          </p>
                        </div>
                        {statusIcon(snapshot.status)}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Run commands */}
              <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
                <h3 className="mb-2 text-sm font-medium">Commands</h3>
                <div className="space-y-2 text-xs">
                  <code className="block rounded bg-bg-base px-2 py-1 text-text-secondary">
                    npm run test:visual
                  </code>
                  <code className="block rounded bg-bg-base px-2 py-1 text-text-secondary">
                    npm run test:visual:baseline
                  </code>
                </div>
              </div>
            </aside>

            {/* Main - Comparison view */}
            <main className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-card p-3">
                {/* Compare mode toggle */}
                <div className="flex gap-1 rounded-lg bg-bg-base p-1">
                  <button
                    onClick={() => setCompareMode("side-by-side")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      compareMode === "side-by-side"
                        ? "bg-accent-500 text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Columns className="h-3.5 w-3.5" />
                    Side by Side
                  </button>
                  <button
                    onClick={() => setCompareMode("overlay")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      compareMode === "overlay"
                        ? "bg-accent-500 text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Overlay
                  </button>
                  <button
                    onClick={() => setCompareMode("slider")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      compareMode === "slider"
                        ? "bg-accent-500 text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Slider
                  </button>
                </div>

                {/* Overlay opacity slider */}
                {compareMode === "overlay" && (
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-text-muted" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-bg-base"
                    />
                    <Eye className="h-4 w-4 text-text-muted" />
                  </div>
                )}

                {/* Snapshot info */}
                {selectedSnapshot && (
                  <div className="text-xs text-text-muted">
                    {selectedSnapshot.name} • {(selectedSnapshot.expectedSize / 1024).toFixed(1)}KB
                  </div>
                )}
              </div>

              {/* Comparison viewer */}
              <div className="rounded-lg border border-border-subtle bg-bg-card p-4">
                {!selectedSnapshot ? (
                  <div className="flex h-64 items-center justify-center text-text-muted">
                    Select a snapshot to compare
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedSnapshot.name + compareMode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {compareMode === "side-by-side" && (
                        <SideBySideView
                          snapshot={selectedSnapshot}
                          getImageUrl={getImageUrl}
                        />
                      )}
                      {compareMode === "overlay" && (
                        <OverlayView
                          snapshot={selectedSnapshot}
                          getImageUrl={getImageUrl}
                          opacity={overlayOpacity}
                        />
                      )}
                      {compareMode === "slider" && (
                        <SliderView
                          snapshot={selectedSnapshot}
                          getImageUrl={getImageUrl}
                          position={sliderPosition}
                          setPosition={setSliderPosition}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Diff image (if exists) */}
              {selectedSnapshot?.diffPath && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Diff Visualization
                  </h3>
                  <img
                    src={getImageUrl(selectedSnapshot.diffPath) || ""}
                    alt="Diff"
                    className="max-h-[400px] rounded border border-border-subtle"
                  />
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

// Side by Side comparison view
function SideBySideView({
  snapshot,
  getImageUrl,
}: {
  snapshot: Snapshot;
  getImageUrl: (path: string | null) => string | null;
}) {
  const expectedUrl = getImageUrl(snapshot.expectedPath);
  const actualUrl = getImageUrl(snapshot.actualPath);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-medium text-text-secondary">Expected (Baseline)</h4>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-base">
          {expectedUrl ? (
            <img src={expectedUrl} alt="Expected" className="w-full" />
          ) : (
            <div className="flex h-48 items-center justify-center text-text-muted">
              No baseline image
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-text-secondary">Actual (Current)</h4>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-base">
          {actualUrl ? (
            <img src={actualUrl} alt="Actual" className="w-full" />
          ) : (
            <div className="flex h-48 items-center justify-center text-text-muted">
              No changes detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Overlay comparison view
function OverlayView({
  snapshot,
  getImageUrl,
  opacity,
}: {
  snapshot: Snapshot;
  getImageUrl: (path: string | null) => string | null;
  opacity: number;
}) {
  const expectedUrl = getImageUrl(snapshot.expectedPath);
  const actualUrl = getImageUrl(snapshot.actualPath);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-base">
      {expectedUrl && (
        <img src={expectedUrl} alt="Expected" className="w-full" />
      )}
      {actualUrl && (
        <img
          src={actualUrl}
          alt="Actual"
          className="absolute inset-0 w-full"
          style={{ opacity }}
        />
      )}
      {!expectedUrl && !actualUrl && (
        <div className="flex h-48 items-center justify-center text-text-muted">
          No images available
        </div>
      )}
    </div>
  );
}

// Slider comparison view
function SliderView({
  snapshot,
  getImageUrl,
  position,
  setPosition,
}: {
  snapshot: Snapshot;
  getImageUrl: (path: string | null) => string | null;
  position: number;
  setPosition: (pos: number) => void;
}) {
  const expectedUrl = getImageUrl(snapshot.expectedPath);
  const actualUrl = getImageUrl(snapshot.actualPath) || expectedUrl;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-base">
      {/* Expected image (right side, visible through clip) */}
      <div className="relative">
        {expectedUrl && (
          <img src={expectedUrl} alt="Expected" className="w-full" />
        )}
      </div>

      {/* Actual image (left side, clipped) */}
      {actualUrl && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img src={actualUrl} alt="Actual" className="w-full" />
        </div>
      )}

      {/* Slider handle */}
      <div
        className="absolute inset-y-0 z-10 w-1 cursor-ew-resize bg-accent-500"
        style={{ left: `${position}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-500 shadow-lg">
          <ChevronLeft className="h-3 w-3 text-white" />
          <ChevronRight className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Slider input (invisible, covers entire area for dragging) */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(parseInt(e.target.value))}
        className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
      />

      {/* Labels */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
        Actual
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
        Expected
      </div>
    </div>
  );
}
