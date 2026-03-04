'use client';

/**
 * CouncilNode - Individual Council Member Node
 * Breathing, illuminated node with spectral glow
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CouncilNodeProps } from './types';

const CouncilNode = React.forwardRef<HTMLDivElement, CouncilNodeProps>(
  ({ config, verdict, isActive, index, onClick }, ref) => {
    const status = verdict?.status ?? 'waiting';
    const isWaiting = status === 'waiting';
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    return (
      <motion.div
        ref={ref}
        className="relative flex items-start gap-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: index * 0.15,
          duration: 0.6,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        {/* Timeline Spine Connection */}
        <div className="relative flex flex-col items-center">
          {/* Connector Line (above) */}
          {index > 0 && (
            <div
              className="absolute -top-16 h-16 w-px"
              style={{
                background: isWaiting
                  ? 'rgba(255,255,255,0.1)'
                  : `linear-gradient(to bottom, transparent, ${config.spectralColour}40)`,
              }}
            />
          )}

          {/* The Node - Breathing Orb */}
          <motion.button
            onClick={onClick}
            className={cn(
              'relative z-10 flex h-16 w-16 items-center justify-center',
              'rounded-full border-[0.5px]',
              'transition-all duration-500',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
              isWaiting && 'border-white/10 bg-white/5',
              isActive && 'border-white/30',
              (isApproved || (!isWaiting && !isRejected)) && 'border-white/20',
              isRejected && 'border-red-500/50'
            )}
            style={{
              opacity: isWaiting ? 0.3 : 1,
              boxShadow: isActive
                ? `0 0 40px ${config.spectralColour}60, 0 0 80px ${config.spectralColour}30, inset 0 0 20px ${config.spectralColour}20`
                : isApproved
                  ? `0 0 20px ${config.spectralColour}40`
                  : 'none',
              background: isActive
                ? `radial-gradient(circle at center, ${config.spectralColour}20 0%, transparent 70%)`
                : isApproved
                  ? `radial-gradient(circle at center, ${config.spectralColour}10 0%, transparent 70%)`
                  : 'rgba(255,255,255,0.02)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`${config.name} - ${status}`}
          >
            {/* Inner Breathing Core */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.9, 1, 0.9],
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    background: `radial-gradient(circle, ${config.spectralColour}40 0%, transparent 70%)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Icon Letter */}
            <span
              className={cn('font-mono text-xl font-bold', 'transition-colors duration-500')}
              style={{
                color: isWaiting ? 'rgba(255,255,255,0.3)' : config.spectralColour,
                textShadow: isActive ? `0 0 20px ${config.spectralColour}` : 'none',
              }}
            >
              {config.icon}
            </span>

            {/* Active Indicator Ring */}
            {isActive && (
              <motion.div
                layoutId="active-council"
                className="absolute -inset-1 rounded-full border-[0.5px]"
                style={{ borderColor: `${config.spectralColour}60` }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </motion.button>

          {/* Status Indicator Dot */}
          <motion.div
            className={cn(
              'mt-3 h-1.5 w-1.5 rounded-full',
              isWaiting && 'bg-white/20',
              isActive && 'bg-white',
              isApproved && 'bg-emerald-400',
              isRejected && 'bg-red-500'
            )}
            animate={
              isActive
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: isActive ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Content Panel */}
        <div
          className={cn(
            'flex-1 pt-1',
            'transition-opacity duration-500',
            isWaiting && 'opacity-30'
          )}
        >
          {/* Name - Huge Editorial */}
          <motion.h3
            className={cn('text-4xl leading-none font-light tracking-tight', 'mb-1')}
            style={{
              color: isWaiting ? 'rgba(255,255,255,0.5)' : config.spectralColour,
              textShadow: isActive ? `0 0 30px ${config.spectralColour}60` : 'none',
            }}
          >
            {config.name}
          </motion.h3>

          {/* Title - Smaller */}
          <p className="mb-3 text-xs tracking-[0.2em] text-white/40 uppercase">{config.title}</p>

          {/* Data Strip - JetBrains Mono */}
          <div
            className={cn(
              'inline-flex items-center gap-3 px-3 py-1.5',
              'rounded-sm border-[0.5px] border-white/10',
              'bg-white/[0.02]'
            )}
          >
            <span className="text-[10px] tracking-widest text-white/30 uppercase">
              {config.domain}
            </span>
            <span
              className="font-mono text-sm font-medium"
              style={{
                color: isWaiting ? 'rgba(255,255,255,0.3)' : config.spectralColour,
              }}
            >
              {config.complexityValue || config.complexityLabel}
            </span>
          </div>

          {/* Verdict Message */}
          {verdict?.message && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 font-mono text-xs text-white/50"
            >
              {verdict.message}
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }
);

CouncilNode.displayName = 'CouncilNode';

export { CouncilNode };
