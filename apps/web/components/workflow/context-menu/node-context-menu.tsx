'use client';

/**
 * Node Context Menu - Scientific Luxury Edition
 *
 * Right-click context menu for workflow nodes.
 * Implements OLED black theme and spectral colours.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Copy, Trash2, Play, Link2Off } from 'lucide-react';
import { BACKGROUNDS, DURATIONS, EASINGS } from '@/lib/design-tokens';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  position: ContextMenuPosition | null;
  nodeId: string | null;
  onClose: () => void;
  onConfigure: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDisconnect: (nodeId: string) => void;
  onRun?: (nodeId: string) => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  variant?: 'default' | 'danger';
  dividerAfter?: boolean;
}

function NodeContextMenuInner({
  position,
  nodeId,
  onClose,
  onConfigure,
  onDuplicate,
  onDelete,
  onDisconnect,
  onRun,
}: NodeContextMenuProps) {
  if (!position || !nodeId) return null;

  const menuItems: MenuItem[] = [
    {
      icon: <Settings2 className="h-3.5 w-3.5" />,
      label: 'Configure',
      shortcut: 'Enter',
      action: () => {
        onConfigure(nodeId);
        onClose();
      },
    },
    {
      icon: <Copy className="h-3.5 w-3.5" />,
      label: 'Duplicate',
      shortcut: '⌘D',
      action: () => {
        onDuplicate(nodeId);
        onClose();
      },
      dividerAfter: true,
    },
    ...(onRun
      ? [
          {
            icon: <Play className="h-3.5 w-3.5" />,
            label: 'Run from here',
            action: () => {
              onRun(nodeId);
              onClose();
            },
            dividerAfter: true,
          },
        ]
      : []),
    {
      icon: <Link2Off className="h-3.5 w-3.5" />,
      label: 'Disconnect all',
      action: () => {
        onDisconnect(nodeId);
        onClose();
      },
    },
    {
      icon: <Trash2 className="h-3.5 w-3.5" />,
      label: 'Delete',
      shortcut: '⌫',
      action: () => {
        onDelete(nodeId);
        onClose();
      },
      variant: 'danger' as const,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50"
        style={{ left: position.x, top: position.y }}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: DURATIONS.fast, ease: EASINGS.outExpo }}
      >
        <div
          className="min-w-[180px] overflow-hidden rounded-sm border-[0.5px] border-white/[0.06] py-1 shadow-xl"
          style={{ backgroundColor: BACKGROUNDS.primary }}
        >
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={item.action}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  item.variant === 'danger'
                    ? 'text-[#FF4444]/70 hover:bg-[#FF4444]/10 hover:text-[#FF4444]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="font-mono text-[10px] text-white/30">{item.shortcut}</span>
                )}
              </button>
              {item.dividerAfter && <div className="my-1 border-t-[0.5px] border-white/[0.06]" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Backdrop to close menu on click outside */}
      <motion.div
        className="fixed inset-0 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    </AnimatePresence>
  );
}

export const NodeContextMenu = memo(NodeContextMenuInner);
