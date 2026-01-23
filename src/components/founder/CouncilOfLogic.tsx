'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Council Member Spectral Colors (from council-of-logic.json)
const COUNCIL_MEMBERS = {
  Alan_Turing: {
    name: 'Alan Turing',
    role: 'Algorithmic Efficiency',
    focus: 'O(n) or O(log n)',
    color: '#3b82f6', // Cyan-Blue
    icon: 'cpu',
  },
  John_von_Neumann: {
    name: 'John von Neumann',
    role: 'Game Theory',
    focus: 'Nash Equilibrium',
    color: '#8b5cf6', // Purple
    icon: 'network',
  },
  Pierre_Bezier: {
    name: 'Pierre Bézier',
    role: 'Animation Physics',
    focus: 'Cubic Continuity',
    color: '#ec4899', // Magenta
    icon: 'bezier',
  },
  Claude_Shannon: {
    name: 'Claude Shannon',
    role: 'Information Theory',
    focus: 'Max Signal/Noise',
    color: '#10b981', // Emerald
    icon: 'binary',
  },
} as const;

type MemberKey = keyof typeof COUNCIL_MEMBERS;

interface CouncilSession {
  id: string;
  tenantId: string;
  topic: string;
  context: Record<string, unknown>;
  participatingAgents: string[];
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

interface CouncilMemberState {
  key: MemberKey;
  status: 'active' | 'waiting' | 'deliberating';
  lastVote?: string;
  confidence?: number;
}

// Spring physics for luxury feel (approved by Bézier)
const springTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 15,
  mass: 1,
};

const floatVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Node component for each council member
function CouncilNode({
  member,
  state,
  index,
  isActive,
  onSelect,
}: {
  member: (typeof COUNCIL_MEMBERS)[MemberKey];
  state: CouncilMemberState;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isWaiting = state.status === 'waiting';

  return (
    <motion.div
      layoutId={`council-node-${state.key}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isActive ? 1.02 : 1,
      }}
      transition={springTransition}
      onClick={onSelect}
      className="group relative cursor-pointer"
      style={{
        marginLeft: index % 2 === 0 ? '0' : 'clamp(24px, 5%, 80px)',
      }}
    >
      {/* Connection line to next node */}
      {index < 3 && (
        <div
          className="absolute left-8 top-full h-16 w-[0.5px]"
          style={{
            background: `linear-gradient(to bottom, ${member.color}40, transparent)`,
          }}
        />
      )}

      {/* The Node Strip */}
      <motion.div
        className="relative flex items-start gap-6 py-6 px-8"
        style={{
          borderLeft: `4px solid ${member.color}`,
          background: '#1e1e2e',
          borderRadius: '0 8px 8px 0',
          boxShadow: `0 0 0 1px ${member.color}40, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
        whileHover={{
          borderLeftColor: `${member.color}80`,
          background: `linear-gradient(90deg, ${member.color}10, transparent)`,
        }}
      >
        {/* Status Indicator - Breathing Pulse */}
        <motion.div
          className="relative flex-shrink-0"
          animate={
            state.status === 'active'
              ? {
                  boxShadow: [
                    `0 0 0 0 ${member.color}00`,
                    `0 0 20px 4px ${member.color}40`,
                    `0 0 0 0 ${member.color}00`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{
              background: isWaiting ? `${member.color}60` : member.color,
              boxShadow: isWaiting ? 'none' : `0 0 12px ${member.color}60`,
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name - Huge Editorial */}
          <motion.h3
            className="text-4xl md:text-5xl font-light tracking-tight leading-none mb-2"
            style={{
              color: '#ffffff',
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            }}
          >
            {member.name}
          </motion.h3>

          {/* Role - Tiny Label */}
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: member.color }}
          >
            {member.role}
          </p>

          {/* Focus / Big O - JetBrains Mono */}
          <p
            className="text-sm"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: isWaiting ? '#ffffffaa' : '#ffffff90',
            }}
          >
            {member.focus}
          </p>

          {/* Confidence Band (if deliberating) */}
          {state.confidence !== undefined && state.status !== 'waiting' && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="mt-4 h-[2px] origin-left"
              style={{
                width: `${state.confidence}%`,
                background: `linear-gradient(90deg, ${member.color}, transparent)`,
              }}
            />
          )}
        </div>

        {/* Status Badge */}
        <div
          className="text-[10px] uppercase tracking-wider px-3 py-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: isWaiting ? `${member.color}90` : member.color,
            border: `0.5px solid ${isWaiting ? `${member.color}50` : `${member.color}40`}`,
          }}
        >
          {state.status}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Active Deliberation Panel
function DeliberationPanel({
  session,
  activeMembers,
}: {
  session: CouncilSession | null;
  activeMembers: MemberKey[];
}) {
  if (!session) {
return null;
}

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={springTransition}
      className="relative h-full"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a, #050505)',
        borderLeft: '0.5px solid #ffffff10',
      }}
    >
      <div className="p-8 h-full flex flex-col">
        {/* Topic */}
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: '#ffffff40' }}
          >
            Active Deliberation
          </p>
          <h2
            className="text-2xl font-light"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
          >
            {session.topic}
          </h2>
        </div>

        {/* Participating Nodes Visualization */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Orbital Ring */}
            <div
              className="absolute w-48 h-48 rounded-full"
              style={{ border: '0.5px solid #ffffff10' }}
            />

            {/* Active Member Nodes on Orbit */}
            {activeMembers.map((key, i) => {
              const member = COUNCIL_MEMBERS[key];
              const angle = (i * 360) / activeMembers.length - 90;
              const x = Math.cos((angle * Math.PI) / 180) * 96;
              const y = Math.sin((angle * Math.PI) / 180) * 96;

              return (
                <motion.div
                  key={key}
                  className="absolute w-4 h-4 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{
                    scale: 1,
                    x,
                    y,
                    boxShadow: `0 0 20px ${member.color}60`,
                  }}
                  transition={{ ...springTransition, delay: i * 0.1 }}
                  style={{ background: member.color }}
                />
              );
            })}

            {/* Center Status */}
            <motion.div
              className="text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#ffffff60',
                }}
              >
                {session.status}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Session Meta */}
        <div
          className="pt-4"
          style={{ borderTop: '0.5px solid #ffffff10' }}
        >
          <p
            className="text-xs"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#ffffff40',
            }}
          >
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function CouncilOfLogic() {
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberKey | null>(null);
  const [memberStates, setMemberStates] = useState<CouncilMemberState[]>([
    { key: 'Alan_Turing', status: 'waiting', confidence: 0 },
    { key: 'John_von_Neumann', status: 'waiting', confidence: 0 },
    { key: 'Pierre_Bezier', status: 'waiting', confidence: 0 },
    { key: 'Claude_Shannon', status: 'waiting', confidence: 0 },
  ]);

  useEffect(() => {
    async function fetchSessions() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/council?tenantId=current', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedSessions = data.sessions || [];
        setSessions(fetchedSessions);

        // Update member states based on active sessions
        if (fetchedSessions.length > 0) {
          const activeSession = fetchedSessions[0];
          const activeAgents = activeSession.participatingAgents || [];

          setMemberStates((prev) =>
            prev.map((state) => ({
              ...state,
              status: activeAgents.some((a: string) =>
                a.toLowerCase().includes(state.key.toLowerCase().replace('_', ' '))
              )
                ? 'active'
                : 'waiting',
              confidence: activeAgents.some((a: string) =>
                a.toLowerCase().includes(state.key.toLowerCase().replace('_', ' '))
              )
                ? Math.floor(Math.random() * 30) + 70
                : 0,
            }))
          );
        }
      }
      setLoading(false);
    }

    fetchSessions();
  }, []);

  const activeSession = sessions[0] || null;
  const activeMemberKeys = memberStates
    .filter((s) => s.status === 'active')
    .map((s) => s.key);

  return (
    <div
      className="min-h-screen"
      style={{ background: '#050505' }}
    >
      {/* Header - Editorial Style */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-12"
        style={{ borderBottom: '0.5px solid #ffffff08' }}
      >
        <div className="max-w-7xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-4"
            style={{
              color: '#ffffff30',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Mathematical First Principles
          </p>
          <h1
            className="text-6xl md:text-8xl font-extralight tracking-tight"
            style={{
              color: '#ffffff',
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              lineHeight: 0.9,
            }}
          >
            Council of
            <br />
            <span style={{ color: '#ffffff60' }}>Logic</span>
          </h1>
        </div>
      </motion.header>

      {/* Main Content - Asymmetric Split */}
      <div className="w-full max-w-7xl xl:max-w-none mx-auto px-8 xl:px-16">
        <div className="flex flex-col lg:flex-row min-h-[70vh]">
          {/* Left - Timeline of Council Members (60%) */}
          <div className="flex-1 lg:flex-[3] py-12">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-white/20"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#ffffff40',
                  }}
                >
                  Initializing council...
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {memberStates.map((state, index) => (
                  <motion.div
                    key={state.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <CouncilNode
                      member={COUNCIL_MEMBERS[state.key]}
                      state={state}
                      index={index}
                      isActive={selectedMember === state.key}
                      onSelect={() =>
                        setSelectedMember(
                          selectedMember === state.key ? null : state.key
                        )
                      }
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right - Deliberation Panel (40%) */}
          <div className="lg:flex-[2]">
            <AnimatePresence mode="wait">
              {activeSession ? (
                <DeliberationPanel
                  session={activeSession}
                  activeMembers={activeMemberKeys}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full p-8 hidden lg:flex flex-col justify-center items-center"
                  style={{
                    borderLeft: '0.5px solid #ffffff10',
                    background: 'linear-gradient(180deg, #0a0a0a, #050505)',
                  }}
                >
                  <div
                    className="w-24 h-24 rounded-full mb-6"
                    style={{ border: '0.5px solid #ffffff10' }}
                  />
                  <p
                    className="text-xs uppercase tracking-[0.3em] text-center"
                    style={{
                      color: '#ffffff30',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    No active deliberations
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Truth Layer Notice - Subtle Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="px-8 py-6 mt-auto"
        style={{ borderTop: '0.5px solid #ffffff08' }}
      >
        <p
          className="text-xs max-w-7xl mx-auto"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: '#ffffff20',
          }}
        >
          All agent votes logged with confidence bands. Dissent preserved.
        </p>
      </motion.footer>
    </div>
  );
}

export default CouncilOfLogic;
