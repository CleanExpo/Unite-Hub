'use client';

/**
 * Collaborator Cursors - Scientific Luxury Edition
 *
 * Renders real-time cursor positions of other collaborators
 * on the workflow canvas with spectral colours and animations.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '@xyflow/react';
import type { CollaboratorInfo } from '@/lib/collaboration/yjs-provider';
import { DURATIONS, EASINGS } from '@/lib/design-tokens';

interface CollaboratorCursorsProps {
  collaborators: CollaboratorInfo[];
}

function CursorIcon({ colour }: { colour: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 4px ${colour}80)` }}
    >
      <path
        d="M5.5 3.21V20.8C5.5 21.45 6.31 21.78 6.78 21.31L10.55 17.54C10.74 17.35 10.99 17.25 11.25 17.25H17.25C18.08 17.25 18.54 16.26 17.97 15.63L6.72 3.36C6.22 2.81 5.5 3.17 5.5 3.21Z"
        fill={colour}
        stroke="#050505"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CollaboratorCursor({ collaborator }: { collaborator: CollaboratorInfo }) {
  const viewport = useViewport();

  if (!collaborator.cursor) return null;

  // Transform from flow coordinates to screen coordinates
  const screenX = collaborator.cursor.x * viewport.zoom + viewport.x;
  const screenY = collaborator.cursor.y * viewport.zoom + viewport.y;

  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: screenX,
        y: screenY,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.1,
        ease: 'linear',
        opacity: { duration: DURATIONS.fast },
        scale: { duration: DURATIONS.fast, ease: EASINGS.outExpo },
      }}
    >
      <CursorIcon colour={collaborator.colour} />

      {/* Name Label */}
      <motion.div
        className="absolute top-5 left-5 rounded-sm border-[0.5px] px-2 py-1 whitespace-nowrap"
        style={{
          backgroundColor: collaborator.colour,
          borderColor: `${collaborator.colour}`,
          boxShadow: `0 0 10px ${collaborator.colour}40`,
        }}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: DURATIONS.fast }}
      >
        <span className="text-[10px] font-medium text-[#050505]">{collaborator.name}</span>
      </motion.div>
    </motion.div>
  );
}

function CollaboratorCursorsInner({ collaborators }: CollaboratorCursorsProps) {
  return (
    <AnimatePresence>
      {collaborators
        .filter((c) => c.cursor)
        .map((collaborator) => (
          <CollaboratorCursor key={collaborator.id} collaborator={collaborator} />
        ))}
    </AnimatePresence>
  );
}

export const CollaboratorCursors = memo(CollaboratorCursorsInner);
