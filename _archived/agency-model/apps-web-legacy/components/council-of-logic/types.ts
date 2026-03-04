/**
 * Council of Logic - Type Definitions
 * Mathematical First Principles Validation System
 */

export type CouncilMember = 'turing' | 'vonNeumann' | 'bezier' | 'shannon';

export type CouncilStatus = 'waiting' | 'active' | 'approved' | 'rejected';

export interface CouncilMemberConfig {
  id: CouncilMember;
  name: string;
  title: string;
  domain: string;
  spectralColour: string;
  spectralGlow: string;
  complexityLabel: string;
  complexityValue?: string;
  icon: string;
}

export interface CouncilVerdict {
  member: CouncilMember;
  status: CouncilStatus;
  message?: string;
  timestamp?: Date;
}

export interface CouncilOfLogicProps {
  /** Current verdicts from each council member */
  verdicts?: CouncilVerdict[];
  /** Active member being evaluated */
  activeMember?: CouncilMember;
  /** Layout variant */
  variant?: 'timeline' | 'orbital';
  /** Show complexity notation */
  showComplexity?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a member is clicked */
  onMemberClick?: (member: CouncilMember) => void;
}

export interface CouncilNodeProps {
  config: CouncilMemberConfig;
  verdict?: CouncilVerdict;
  isActive: boolean;
  index: number;
  onClick?: () => void;
}

/**
 * Spectral colour mapping for council members
 * Turing = Cyan (algorithmic precision)
 * Von Neumann = Amber (strategic warmth)
 * Bezier = Magenta (creative physics)
 * Shannon = Emerald (information flow)
 */
export const COUNCIL_MEMBERS: Record<CouncilMember, CouncilMemberConfig> = {
  turing: {
    id: 'turing',
    name: 'Alan Turing',
    title: 'Algorithmic Efficiency',
    domain: 'Time Complexity',
    spectralColour: '#00F5FF',
    spectralGlow: '185 100% 50%',
    complexityLabel: 'O(n)',
    icon: 'T',
  },
  vonNeumann: {
    id: 'vonNeumann',
    name: 'John von Neumann',
    title: 'System Architecture',
    domain: 'Pattern Optimisation',
    spectralColour: '#FFB800',
    spectralGlow: '43 100% 50%',
    complexityLabel: 'Nash',
    icon: 'N',
  },
  bezier: {
    id: 'bezier',
    name: 'Pierre Bezier',
    title: 'Animation Physics',
    domain: 'Transition Curves',
    spectralColour: '#FF00FF',
    spectralGlow: '300 100% 50%',
    complexityLabel: 'Cubic',
    icon: 'B',
  },
  shannon: {
    id: 'shannon',
    name: 'Claude Shannon',
    title: 'Information Theory',
    domain: 'Token Economy',
    spectralColour: '#00FF88',
    spectralGlow: '150 100% 50%',
    complexityLabel: 'H(X)',
    icon: 'S',
  },
};
