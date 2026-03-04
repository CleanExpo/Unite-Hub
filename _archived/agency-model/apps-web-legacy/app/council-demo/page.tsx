'use client';

/**
 * Council of Logic - Demo Page
 * Interactive demonstration of the Mathematical First Principles Validation System
 */

import * as React from 'react';
import {
  CouncilOfLogic,
  type CouncilMember,
  type CouncilVerdict,
} from '@/components/council-of-logic';

export default function CouncilDemoPage() {
  const [activeMember, setActiveMember] = React.useState<CouncilMember | undefined>('turing');
  const [verdicts, setVerdicts] = React.useState<CouncilVerdict[]>([
    { member: 'turing', status: 'approved', message: 'Time complexity O(n log n) - APPROVED' },
    { member: 'vonNeumann', status: 'active', message: 'Evaluating Nash equilibrium...' },
    { member: 'bezier', status: 'waiting' },
    { member: 'shannon', status: 'waiting' },
  ]);

  const handleMemberClick = (member: CouncilMember) => {
    setActiveMember(member);
  };

  // Simulate progression through council approval
  const simulateApproval = () => {
    const sequence: CouncilMember[] = ['turing', 'vonNeumann', 'bezier', 'shannon'];
    let index = 0;

    const interval = setInterval(() => {
      if (index >= sequence.length) {
        clearInterval(interval);
        setActiveMember(undefined);
        return;
      }

      const currentMember = sequence[index];
      setActiveMember(currentMember);

      // Update verdict for previous member
      if (index > 0) {
        const prevMember = sequence[index - 1];
        setVerdicts((prev) =>
          prev.map((v) =>
            v.member === prevMember
              ? { ...v, status: 'approved', message: `${prevMember.toUpperCase()} - VERIFIED` }
              : v
          )
        );
      }

      // Set current member as active
      setVerdicts((prev) =>
        prev.map((v) =>
          v.member === currentMember ? { ...v, status: 'active', message: 'Evaluating...' } : v
        )
      );

      index++;
    }, 2000);

    return () => clearInterval(interval);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      {/* Header */}
      <header className="mx-auto mb-8 max-w-4xl">
        <p className="mb-2 text-xs tracking-[0.3em] text-white/30 uppercase">
          Design System Component
        </p>
        <h1 className="mb-4 text-3xl font-light text-white">Council of Logic Interface</h1>
        <p className="max-w-2xl text-sm text-white/50">
          Mathematical First Principles validation system. Replaces generic card grids with a
          timeline/orbital layout featuring spectral colours, breathing animations, and editorial
          typography.
        </p>
      </header>

      {/* Controls */}
      <div className="mx-auto mb-8 flex max-w-4xl gap-4">
        <button
          onClick={simulateApproval}
          className="rounded-sm border-[0.5px] border-cyan-500/30 px-4 py-2 font-mono text-sm text-cyan-400 transition-colors hover:bg-cyan-500/10"
        >
          Simulate Approval Flow
        </button>
        <button
          onClick={() => {
            setVerdicts([
              { member: 'turing', status: 'waiting' },
              { member: 'vonNeumann', status: 'waiting' },
              { member: 'bezier', status: 'waiting' },
              { member: 'shannon', status: 'waiting' },
            ]);
            setActiveMember(undefined);
          }}
          className="rounded-sm border-[0.5px] border-white/10 px-4 py-2 font-mono text-sm text-white/50 transition-colors hover:bg-white/5"
        >
          Reset
        </button>
      </div>

      {/* Council Component */}
      <div className="mx-auto max-w-4xl">
        <CouncilOfLogic
          verdicts={verdicts}
          activeMember={activeMember}
          onMemberClick={handleMemberClick}
          showComplexity
        />
      </div>

      {/* Design Notes */}
      <footer className="mx-auto mt-12 max-w-4xl border-t border-white/10 pt-8">
        <h2 className="mb-4 font-mono text-sm text-white/40">DESIGN NOTES</h2>
        <ul className="space-y-2 text-xs text-white/30">
          <li className="flex gap-3">
            <span className="text-cyan-400">Turing</span>
            <span>Cyan (#00F5FF) - Algorithmic precision</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-400">Von Neumann</span>
            <span>Amber (#FFB800) - Strategic warmth</span>
          </li>
          <li className="flex gap-3">
            <span className="text-fuchsia-400">Bezier</span>
            <span>Magenta (#FF00FF) - Creative physics</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400">Shannon</span>
            <span>Emerald (#00FF88) - Information flow</span>
          </li>
        </ul>
      </footer>
    </div>
  );
}
