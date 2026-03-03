'use client';

/**
 * CouncilOfLogic - Mathematical First Principles Validation Interface
 *
 * DESIGN PHILOSOPHY:
 * - DESTROYED the generic 2x2 grid layout
 * - Timeline/Orbital layout with breathing nodes
 * - Spectral colour system: Turing=Cyan, VonNeumann=Amber, Bezier=Magenta, Shannon=Emerald
 * - OLED Black background (#050505)
 * - Single pixel borders (border-[0.5px])
 * - JetBrains Mono for all data values
 * - Huge editorial typography for names
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CouncilNode } from './CouncilNode';
import { COUNCIL_MEMBERS, type CouncilOfLogicProps, type CouncilMember } from './types';

const CouncilOfLogic = React.forwardRef<HTMLDivElement, CouncilOfLogicProps>(
  (
    {
      verdicts = [],
      activeMember,
      variant: _variant = 'timeline',
      showComplexity = true,
      className,
      onMemberClick,
    },
    ref
  ) => {
    const memberOrder: CouncilMember[] = ['turing', 'vonNeumann', 'bezier', 'shannon'];

    // Calculate overall approval status
    const approvedCount = verdicts.filter((v) => v.status === 'approved').length;
    const rejectedCount = verdicts.filter((v) => v.status === 'rejected').length;
    const isAllApproved = approvedCount === 4;
    const hasRejection = rejectedCount > 0;

    return (
      <div
        ref={ref}
        className={cn(
          // OLED Black background
          'relative min-h-[600px] p-8 lg:p-12',
          'bg-[#050505]',
          // Subtle border
          'border-[0.5px] border-white/[0.06]',
          'overflow-hidden rounded-sm',
          className
        )}
      >
        {/* Ambient Background Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {activeMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%]"
              style={{
                background: `radial-gradient(ellipse at 30% 20%, ${COUNCIL_MEMBERS[activeMember].spectralColour}15 0%, transparent 50%)`,
              }}
            />
          )}
        </div>

        {/* Header Section */}
        <header className="relative mb-12">
          {/* Title Row */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 text-[10px] tracking-[0.3em] text-white/30 uppercase"
              >
                Mathematical First Principles
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-extralight tracking-tight text-white lg:text-6xl"
              >
                Council of Logic
              </motion.h1>
            </div>

            {/* Status Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'flex items-center gap-3 px-4 py-2',
                'rounded-sm border-[0.5px]',
                'font-mono text-xs',
                isAllApproved && 'border-emerald-500/30 text-emerald-400',
                hasRejection && 'border-red-500/30 text-red-400',
                !isAllApproved && !hasRejection && 'border-white/10 text-white/40'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isAllApproved && 'bg-emerald-400',
                  hasRejection && 'bg-red-500',
                  !isAllApproved && !hasRejection && 'bg-white/30'
                )}
              />
              <span>
                {isAllApproved
                  ? 'ALL APPROVED'
                  : hasRejection
                    ? `${rejectedCount} REJECTED`
                    : `${approvedCount}/4 VERIFIED`}
              </span>
            </motion.div>
          </div>

          {/* Horizontal Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="h-px origin-left bg-gradient-to-r from-white/10 via-white/5 to-transparent"
          />
        </header>

        {/* Council Members - Timeline Layout */}
        <div className="relative pl-4">
          {/* Vertical Timeline Spine */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.19, 1, 0.22, 1] }}
            className="absolute top-0 bottom-0 left-12 w-px origin-top bg-gradient-to-b from-white/10 via-white/5 to-transparent"
          />

          {/* Council Nodes */}
          <div className="space-y-16">
            {memberOrder.map((memberId, index) => {
              const config = COUNCIL_MEMBERS[memberId];
              const verdict = verdicts.find((v) => v.member === memberId);
              const isActive = activeMember === memberId;

              return (
                <CouncilNode
                  key={memberId}
                  config={{
                    ...config,
                    complexityValue: showComplexity ? config.complexityLabel : undefined,
                  }}
                  verdict={verdict}
                  isActive={isActive}
                  index={index}
                  onClick={() => onMemberClick?.(memberId)}
                />
              );
            })}
          </div>
        </div>

        {/* Footer - Protocol Reference */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute right-8 bottom-6 left-8 flex items-center justify-between"
        >
          <p className="font-mono text-[10px] text-white/20">GENESIS PROTOCOL v2.0.1</p>
          <p className="font-mono text-[10px] text-white/20">
            {new Date().toLocaleDateString('en-AU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </motion.footer>
      </div>
    );
  }
);

CouncilOfLogic.displayName = 'CouncilOfLogic';

export { CouncilOfLogic };
