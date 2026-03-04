'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => m.Excalidraw),
  { ssr: false, loading: () => <ExcalidrawSkeleton /> },
);

function ExcalidrawSkeleton() {
  return (
    <div className="flex items-center justify-center bg-[#0d0d0d] rounded-sm border border-[#1a1a1a]" style={{ minHeight: 400 }}>
      <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
    </div>
  );
}

interface ExcalidrawEmbedProps {
  initialData?: {
    elements?: readonly ExcalidrawElement[];
    appState?: Partial<AppState>;
    files?: BinaryFiles;
  };
  onChange?: (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => void;
  readOnly?: boolean;
  height?: number | string;
}

export function ExcalidrawEmbed({
  initialData,
  onChange,
  readOnly = false,
  height = 500,
}: ExcalidrawEmbedProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (!onChange) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(elements, appState, files);
      }, 500);
    },
    [onChange],
  );

  return (
    <div
      className="rounded-sm border border-[#1a1a1a] overflow-hidden bg-[#0d0d0d]"
      style={{ height }}
    >
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        theme="dark"
        viewModeEnabled={readOnly}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
