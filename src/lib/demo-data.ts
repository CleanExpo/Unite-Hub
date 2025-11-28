/**
 * Demo Data Provider
 *
 * Provides mock data for development and testing without requiring database connection.
 * Use ONLY when NEXT_PUBLIC_DEMO_MODE=true is explicitly set.
 *
 * IMPORTANT: Demo mode is now OFF by default in all environments.
 * To enable demo mode, set NEXT_PUBLIC_DEMO_MODE=true in your environment.
 */

/**
 * Check if demo mode is explicitly enabled via environment variable.
 * Returns false by default - must be explicitly enabled.
 */
const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_ORG_ID = "demo-unite-hub-org-123" as any;

// Team Members
export const demoTeamMembers = [
  {
    id: "1",
    name: "Claire Davis",
    role: "Senior Designer",
    email: "claire@unite-hub.com",
    phone: "+1 (555) 123-4567",
    initials: "CD",
    capacity: 85,
    hoursAllocated: 34,
    hoursAvailable: 40,
    status: "near-capacity" as const,
    currentProjects: 3,
    skills: ["UI/UX Design", "Branding", "Figma"],
    joinDate: "Jan 2024",
  },
  {
    id: "2",
    name: "Mike Johnson",
    role: "Content Strategist",
    email: "mike@unite-hub.com",
    phone: "+1 (555) 234-5678",
    initials: "MJ",
    capacity: 60,
    hoursAllocated: 24,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
    skills: ["Copywriting", "SEO", "Content Strategy"],
    joinDate: "Mar 2024",
  },
  {
    id: "3",
    name: "Sarah Lee",
    role: "Video Producer",
    email: "sarah@unite-hub.com",
    phone: "+1 (555) 345-6789",
    initials: "SL",
    capacity: 105,
    hoursAllocated: 42,
    hoursAvailable: 40,
    status: "over-capacity" as const,
    currentProjects: 4,
    skills: ["Video Editing", "Motion Graphics", "Premiere Pro"],
    joinDate: "Feb 2024",
  },
  {
    id: "4",
    name: "Tom Wilson",
    role: "Developer",
    email: "tom@unite-hub.com",
    phone: "+1 (555) 456-7890",
    initials: "TW",
    capacity: 70,
    hoursAllocated: 28,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
    skills: ["React", "Next.js", "TypeScript"],
    joinDate: "Dec 2023",
  },
];

// Demo Contacts
export const demoContacts = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@acme.com",
    company: "Acme Corporation",
    role: "CEO",
    status: "active",
    tags: ["High-Value", "Decision Maker"],
    lastContact: "2025-11-10",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@techstart.com",
    company: "TechStart Inc",
    role: "Marketing Director",
    status: "active",
    tags: ["Lead", "Marketing"],
    lastContact: "2025-11-12",
  },
  {
    id: "3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob@startup.co",
    company: "StartUp Co",
    role: "Founder",
    status: "active",
    tags: ["New Client", "SMB"],
    lastContact: "2025-11-13",
  },
];

// Demo Campaigns
export const demoCampaigns = [
  {
    id: "1",
    name: "Q4 Product Launch",
    status: "active",
    type: "email",
    sentCount: 1250,
    openRate: 42.3,
    clickRate: 18.7,
    startDate: "2025-11-01",
    endDate: "2025-12-31",
  },
  {
    id: "2",
    name: "Holiday Promotion",
    status: "scheduled",
    type: "email",
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    startDate: "2025-12-15",
    endDate: "2025-12-25",
  },
  {
    id: "3",
    name: "Newsletter - November",
    status: "completed",
    type: "email",
    sentCount: 3420,
    openRate: 38.9,
    clickRate: 15.2,
    startDate: "2025-11-01",
    endDate: "2025-11-07",
  },
];

// Demo Workspaces
export const demoWorkspaces = [
  {
    id: "1",
    name: "Marketing Team",
    description: "Marketing campaigns and content creation",
    memberCount: 8,
    projectCount: 12,
    color: "#3b9ba8",
  },
  {
    id: "2",
    name: "Design Studio",
    description: "Brand design and creative projects",
    memberCount: 5,
    projectCount: 7,
    color: "#f39c12",
  },
  {
    id: "3",
    name: "Development",
    description: "Web and mobile development projects",
    memberCount: 6,
    projectCount: 9,
    color: "#2563ab",
  },
];

// Demo Settings
export const demoSettings = {
  organization: {
    name: "Unite-Hub Demo Organization",
    email: "contact@unite-hub-demo.com",
    website: "https://unite-hub-demo.com",
    timezone: "America/New_York",
  },
  user: {
    name: "Phill Harris",
    email: "phill@unite-hub.com",
    role: "owner",
    initials: "PH",
  },
  preferences: {
    emailNotifications: true,
    desktopNotifications: false,
    weeklyReports: true,
    theme: "light",
  },
};

// Helper functions
export function getDemoContacts() {
  return demoContacts;
}

export function getDemoCampaigns() {
  return demoCampaigns;
}

export function getDemoWorkspaces() {
  return demoWorkspaces;
}

export function getDemoSettings() {
  return demoSettings;
}

export function getDemoTeamMembers() {
  return demoTeamMembers;
}

/**
 * Check if we're in demo mode.
 *
 * Demo mode is enabled ONLY when:
 * 1. NEXT_PUBLIC_DEMO_MODE=true is set in environment, AND
 * 2. Either localStorage has demo_org_id OR we're explicitly in demo mode
 *
 * Note: No longer auto-enables for NODE_ENV=development
 */
export function isDemoMode(): boolean {
  // If demo mode is not explicitly enabled via env, always return false
  if (!DEMO_MODE_ENABLED) {
    return false;
  }

  // Server-side: only check env flag
  if (typeof window === "undefined") {
    return DEMO_MODE_ENABLED;
  }

  // Client-side: check localStorage OR env flag
  const demoOrgId = localStorage.getItem("demo_org_id");
  return demoOrgId === DEMO_ORG_ID || DEMO_MODE_ENABLED;
}

/**
 * Initialize demo mode (client-side only).
 * Note: NEXT_PUBLIC_DEMO_MODE=true must be set for this to have effect.
 */
export function enableDemoMode() {
  if (typeof window === "undefined") return;

  if (!DEMO_MODE_ENABLED) {
    console.warn(
      "Demo mode cannot be enabled: NEXT_PUBLIC_DEMO_MODE is not set to 'true'. " +
        "Set NEXT_PUBLIC_DEMO_MODE=true in your environment to enable demo mode."
    );
    return;
  }

  localStorage.setItem("demo_org_id", DEMO_ORG_ID);
  console.log("Demo mode enabled");
}

/**
 * Disable demo mode (client-side only).
 */
export function disableDemoMode() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("demo_org_id");
  console.log("Demo mode disabled");
}

/**
 * Check if demo mode is available (env flag is set).
 * Useful for showing/hiding demo mode toggle in UI.
 */
export function isDemoModeAvailable(): boolean {
  return DEMO_MODE_ENABLED;
}
