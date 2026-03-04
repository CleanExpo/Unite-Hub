'use client';

/**
 * Collaboration Status - Scientific Luxury Edition
 *
 * Shows real-time collaboration status and connected users.
 * Implements OLED black theme and spectral colours.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { BACKGROUNDS, DURATIONS, EASINGS } from '@/lib/design-tokens';
import type { CollaboratorInfo } from '@/lib/collaboration/yjs-provider';

interface CollaborationStatusProps {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: CollaboratorInfo[];
  localColour: string;
  userName: string;
}

function CollaboratorAvatar({
  collaborator,
  isLocal = false,
}: {
  collaborator: CollaboratorInfo | { name: string; colour: string };
  isLocal?: boolean;
}) {
  const initials = collaborator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: DURATIONS.fast, ease: EASINGS.outExpo }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold"
        style={{
          backgroundColor: `${collaborator.colour}20`,
          borderColor: collaborator.colour,
          color: collaborator.colour,
        }}
        title={isLocal ? `${collaborator.name} (you)` : collaborator.name}
      >
        {initials}
      </div>

      {/* Online indicator */}
      <motion.div
        className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2"
        style={{
          backgroundColor: '#00FF88',
          borderColor: BACKGROUNDS.primary,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

function CollaborationStatusInner({
  isConnected,
  isSynced,
  collaborators,
  localColour,
  userName,
}: CollaborationStatusProps) {
  const totalUsers = collaborators.length + 1; // +1 for local user

  return (
    <motion.div
      className="flex items-center gap-3 rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505]/90 px-3 py-2 backdrop-blur-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATIONS.normal, ease: EASINGS.outExpo }}
    >
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          isSynced ? (
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Wifi className="h-3.5 w-3.5 text-[#00FF88]" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-3.5 w-3.5 text-[#00F5FF]" />
            </motion.div>
          )
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-[#FF4444]" />
        )}
        <span
          className="text-[10px] tracking-wider uppercase"
          style={{
            color: isConnected ? (isSynced ? '#00FF88' : '#00F5FF') : '#FF4444',
          }}
        >
          {isConnected ? (isSynced ? 'Live' : 'Syncing') : 'Offline'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/10" />

      {/* Users Count */}
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-white/40" />
        <span className="font-mono text-xs text-white/70">{totalUsers}</span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-white/10" />

      {/* User Avatars */}
      <div className="flex items-center -space-x-2">
        {/* Local user */}
        <CollaboratorAvatar collaborator={{ name: userName, colour: localColour }} isLocal />

        {/* Remote collaborators */}
        <AnimatePresence>
          {collaborators.slice(0, 4).map((collaborator) => (
            <CollaboratorAvatar key={collaborator.id} collaborator={collaborator} />
          ))}
        </AnimatePresence>

        {/* Overflow indicator */}
        {collaborators.length > 4 && (
          <motion.div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/20 bg-white/5 text-[10px] text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            +{collaborators.length - 4}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export const CollaborationStatus = memo(CollaborationStatusInner);
