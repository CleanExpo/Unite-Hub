/**
 * Demo Data Provider
 *
 * Provides mock data for development and testing without requiring database connection.
 * Use in development mode or when demoing features.
 */

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

// Check if we're in demo mode
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;

  const demoOrgId = localStorage.getItem("demo_org_id");
  return demoOrgId === DEMO_ORG_ID || process.env.NODE_ENV === "development";
}

// Initialize demo mode
export function enableDemoMode() {
  if (typeof window === "undefined") return;

  localStorage.setItem("demo_org_id", DEMO_ORG_ID);
  console.log("Demo mode enabled");
}

// Disable demo mode
export function disableDemoMode() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("demo_org_id");
  console.log("Demo mode disabled");
}
