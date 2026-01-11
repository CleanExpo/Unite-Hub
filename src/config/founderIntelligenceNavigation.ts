/**
 * Founder Intelligence Navigation Configuration
 * F09-F12 navigation items for Founder Cockpit
 */

import { Brain, Zap, GitBranch, HeartPulse } from "lucide-react";

export type FounderIntelligenceNavItem = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: any;
  phase: string;
  badge?: string | number | null;
  gradient?: boolean;
};

export const founderIntelligenceNavigation: FounderIntelligenceNavItem[] = [
  {
    id: "cognitive-load",
    name: "Cognitive Load",
    description: "Mental load tracking with recovery recommendations",
    href: "/founder/cognitive-load",
    icon: Brain,
    phase: "F09",
    badge: null,
    gradient: false,
  },
  {
    id: "energy-mapping",
    name: "Energy Mapping",
    description: "Energy peaks/troughs with optimal work windows",
    href: "/founder/energy-mapping",
    icon: Zap,
    phase: "F10",
    badge: null,
    gradient: false,
  },
  {
    id: "intent-router",
    name: "Intent Router",
    description: "Automatic signal routing to appropriate systems",
    href: "/founder/intent-router",
    icon: GitBranch,
    phase: "F11",
    badge: null,
    gradient: false,
  },
  {
    id: "recovery-protocols",
    name: "Recovery Protocols",
    description: "Recovery state tracking with automated recommendations",
    href: "/founder/recovery-protocols",
    icon: HeartPulse,
    phase: "F12",
    badge: null,
    gradient: true,
  },
];

// Category for organizing in navigation menus
export const founderIntelligenceCategory = {
  id: "founder-intelligence",
  name: "Founder Intelligence",
  description: "F09-F12: Advanced founder cognitive and energy management",
  items: founderIntelligenceNavigation,
};
