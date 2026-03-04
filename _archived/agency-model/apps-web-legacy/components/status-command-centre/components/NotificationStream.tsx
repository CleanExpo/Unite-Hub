'use client';

/**
 * NotificationStream - Real-time event feed
 * REFACTORED: Timeline aesthetic with spectral colours
 *
 * DESTROYED:
 * - Lucide icons
 * - Generic muted-foreground colours
 * - CSS animations
 * - Standard borders
 *
 * IMPLEMENTED:
 * - Spectral colour system
 * - Framer Motion animations
 * - OLED Black aesthetic
 * - Single pixel borders
 * - JetBrains Mono typography
 * - Timeline pulse indicators
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getRelativeTimeAU } from '../utils/format-duration';
import type { NotificationStreamProps, Notification } from '../types';

// Spectral colours for notification types
const SPECTRAL_COLOURS: Record<Notification['type'], string> = {
  start: '#00F5FF', // Cyan - beginning
  progress: '#00F5FF', // Cyan - in motion
  complete: '#00FF88', // Emerald - success
  error: '#FF4444', // Red - failure
  escalation: '#FF00FF', // Magenta - human needed
  verification: '#FFB800', // Amber - checking
};

// Labels for notification types
const TYPE_LABELS: Record<Notification['type'], string> = {
  start: 'STARTED',
  progress: 'PROGRESS',
  complete: 'COMPLETED',
  error: 'ERROR',
  escalation: 'ESCALATED',
  verification: 'VERIFYING',
};

const NotificationStream = React.forwardRef<HTMLDivElement, NotificationStreamProps>(
  (
    {
      notifications,
      maxItems = 20,
      filter = 'all',
      autoScroll = true,
      onNotificationClick,
      className,
    },
    ref
  ) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Filter notifications
    const filteredNotifications = React.useMemo(() => {
      let filtered = notifications;

      if (filter === 'errors') {
        filtered = notifications.filter((n) => n.type === 'error');
      } else if (filter === 'warnings') {
        filtered = notifications.filter(
          (n) => n.type === 'escalation' || n.type === 'verification'
        );
      } else if (filter === 'info') {
        filtered = notifications.filter(
          (n) => n.type === 'start' || n.type === 'progress' || n.type === 'complete'
        );
      }

      return filtered.slice(-maxItems);
    }, [notifications, filter, maxItems]);

    // Auto-scroll to bottom on new notifications
    React.useEffect(() => {
      if (autoScroll && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, [filteredNotifications.length, autoScroll]);

    // Empty state
    if (filteredNotifications.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex h-full flex-col items-center justify-center py-12',
            'bg-white/[0.01]',
            className
          )}
        >
          {/* Empty state breathing indicator */}
          <motion.div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-white/10"
            animate={{
              boxShadow: [
                '0 0 0 rgba(255,255,255,0.1)',
                '0 0 20px rgba(255,255,255,0.05)',
                '0 0 0 rgba(255,255,255,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-white/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <p className="text-sm font-light text-white/40">No notifications</p>
          <p className="mt-1 font-mono text-[10px] text-white/20">
            Events will appear here in real-time
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('flex h-full flex-col', className)}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3"
        >
          <div>
            <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">Activity Stream</p>
          </div>
          <span className="font-mono text-[10px] text-white/40 tabular-nums">
            {filteredNotifications.length} events
          </span>
        </motion.header>

        {/* Scrollable notifications list */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1 overflow-y-auto"
        >
          {/* Timeline spine */}
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

            {/* Notification items */}
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => onNotificationClick?.(notification.runId)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }
);

NotificationStream.displayName = 'NotificationStream';

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  index: number;
}

function NotificationItem({ notification, onClick, index }: NotificationItemProps) {
  const colour = SPECTRAL_COLOURS[notification.type];
  const label = TYPE_LABELS[notification.type];
  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'complete';

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        delay: index * 0.03,
        duration: 0.4,
        ease: [0.19, 1, 0.22, 1],
      }}
      className={cn(
        'group relative w-full px-4 py-3 text-left',
        'transition-colors duration-300',
        'hover:bg-white/[0.02]',
        'focus:bg-white/[0.02] focus:outline-none'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Timeline node */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Pulse indicator */}
          <motion.div
            className="flex h-5 w-5 items-center justify-center rounded-full border-[0.5px]"
            style={{
              borderColor: `${colour}50`,
              backgroundColor: `${colour}10`,
            }}
            whileHover={{ scale: 1.2 }}
            animate={
              isError
                ? { boxShadow: [`0 0 0 ${colour}00`, `0 0 15px ${colour}40`, `0 0 0 ${colour}00`] }
                : {}
            }
            transition={{ duration: 1.5, repeat: isError ? Infinity : 0 }}
          >
            <motion.div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: colour }}
              animate={isSuccess ? {} : { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Agent name and type badge */}
          <div className="mb-1 flex items-center gap-2">
            <span
              className="truncate text-sm font-light transition-colors duration-300"
              style={{
                color: `rgba(255,255,255,0.8)`,
              }}
            >
              {notification.agentName}
            </span>
            <span
              className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-wider"
              style={{
                backgroundColor: `${colour}15`,
                color: colour,
                border: `0.5px solid ${colour}30`,
              }}
            >
              {label}
            </span>
          </div>

          {/* Message */}
          <p className="line-clamp-2 font-mono text-xs text-white/50 transition-colors duration-300 group-hover:text-white/70">
            {notification.message}
          </p>

          {/* Timestamp */}
          <span className="mt-1 block font-mono text-[10px] text-white/30">
            {getRelativeTimeAU(notification.timestamp)}
          </span>
        </div>

        {/* Hover glow effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, ${colour}05 0%, transparent 50%)`,
          }}
        />
      </div>
    </motion.button>
  );
}

export { NotificationStream };
