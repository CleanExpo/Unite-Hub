/**
 * Demo Data Provider
 *
 * Provides realistic Australian trade industry mock data for development and testing.
 * Use ONLY when NEXT_PUBLIC_DEMO_MODE=true is explicitly set.
 *
 * IMPORTANT: Demo mode is now OFF by default in all environments.
 * To enable demo mode, set NEXT_PUBLIC_DEMO_MODE=true in your environment.
 *
 * All data represents authentic Australian trade businesses:
 * - Plumbing, Electrical, HVAC, Building, and Restoration services
 * - Australian Business Numbers (ABNs), addresses, and phone formats
 * - Realistic project values and industry terminology
 */

/**
 * Check if demo mode is explicitly enabled via environment variable.
 * Returns false by default - must be explicitly enabled.
 */
const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_ORG_ID = "demo-unite-hub-org-123" as any;

// ============================================================================
// AUSTRALIAN TRADE INDUSTRY CLIENTS
// ============================================================================

export interface TradeClient {
  id: string;
  businessName: string;
  tradingAs?: string;
  abn: string;
  acn?: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  industry: 'plumbing' | 'electrical' | 'hvac' | 'building' | 'restoration';
  licenseNumber: string;
  insuranceExpiry: string;
  status: 'active' | 'prospect' | 'inactive';
  tags: string[];
  notes?: string;
  annualRevenue?: number;
  employeeCount?: number;
  createdAt: string;
  lastContact: string;
}

export const demoTradeClients: TradeClient[] = [
  {
    id: "tc-001",
    businessName: "Clearwater Plumbing Solutions Pty Ltd",
    tradingAs: "Clearwater Plumbing",
    abn: "51 824 753 166",
    contactFirstName: "Marcus",
    contactLastName: "O'Brien",
    email: "marcus@clearwaterplumbing.com.au",
    phone: "+61 2 9876 5432",
    mobile: "+61 412 345 678",
    address: {
      street: "42 Industrial Drive",
      suburb: "Wetherill Park",
      state: "NSW",
      postcode: "2164",
    },
    industry: "plumbing",
    licenseNumber: "PL-247851",
    insuranceExpiry: "2026-03-15",
    status: "active",
    tags: ["Commercial", "Strata", "24/7 Emergency", "High-Value"],
    notes: "Handles all Western Sydney strata contracts. Preferred vendor for Stockland properties.",
    annualRevenue: 2850000,
    employeeCount: 18,
    createdAt: "2024-02-15",
    lastContact: "2025-11-28",
  },
  {
    id: "tc-002",
    businessName: "Brightspark Electrical Services",
    abn: "73 915 482 037",
    contactFirstName: "David",
    contactLastName: "Nguyen",
    email: "david@brightsparkelectrical.com.au",
    phone: "+61 3 9012 3456",
    mobile: "+61 438 901 234",
    address: {
      street: "156 Progress Road",
      suburb: "Dandenong South",
      state: "VIC",
      postcode: "3175",
    },
    industry: "electrical",
    licenseNumber: "REC-28451",
    insuranceExpiry: "2026-06-30",
    status: "active",
    tags: ["Solar", "EV Charging", "Commercial", "Industrial"],
    notes: "Specialises in solar installations and EV charging infrastructure. Tesla Certified Installer.",
    annualRevenue: 4200000,
    employeeCount: 24,
    createdAt: "2023-09-10",
    lastContact: "2025-11-25",
  },
  {
    id: "tc-003",
    businessName: "Polar Climate Control Pty Ltd",
    tradingAs: "Polar Air Conditioning",
    abn: "29 847 361 592",
    contactFirstName: "Sarah",
    contactLastName: "Thompson",
    email: "sarah@polaraircon.com.au",
    phone: "+61 7 3456 7890",
    mobile: "+61 455 678 901",
    address: {
      street: "88 Boundary Road",
      suburb: "Rocklea",
      state: "QLD",
      postcode: "4106",
    },
    industry: "hvac",
    licenseNumber: "ARC-L087452",
    insuranceExpiry: "2026-01-20",
    status: "active",
    tags: ["Commercial HVAC", "Refrigeration", "Maintenance Contracts", "Decision Maker"],
    notes: "Major contracts with Woolworths and Coles for refrigeration maintenance across SEQ.",
    annualRevenue: 5600000,
    employeeCount: 32,
    createdAt: "2023-05-22",
    lastContact: "2025-11-27",
  },
  {
    id: "tc-004",
    businessName: "Ironbark Construction Group",
    abn: "64 738 295 401",
    acn: "738 295 401",
    contactFirstName: "Michael",
    contactLastName: "Fitzgerald",
    email: "mfitzgerald@ironbarkconstruction.com.au",
    phone: "+61 8 9234 5678",
    mobile: "+61 421 234 567",
    address: {
      street: "Unit 3, 245 Great Eastern Highway",
      suburb: "Belmont",
      state: "WA",
      postcode: "6104",
    },
    industry: "building",
    licenseNumber: "BC-102847",
    insuranceExpiry: "2026-04-10",
    status: "active",
    tags: ["Residential", "Renovations", "New Builds", "Project Management"],
    notes: "Award-winning builder. Winner of HIA Perth Home of the Year 2024.",
    annualRevenue: 8500000,
    employeeCount: 45,
    createdAt: "2023-03-01",
    lastContact: "2025-11-26",
  },
  {
    id: "tc-005",
    businessName: "FloodFix Restoration Services",
    tradingAs: "FloodFix Australia",
    abn: "38 629 184 753",
    contactFirstName: "Jennifer",
    contactLastName: "Walsh",
    email: "jenny@floodfix.com.au",
    phone: "+61 2 4567 8901",
    mobile: "+61 467 890 123",
    address: {
      street: "12 Disaster Recovery Lane",
      suburb: "Tuggerah",
      state: "NSW",
      postcode: "2259",
    },
    industry: "restoration",
    licenseNumber: "IICRC-128475",
    insuranceExpiry: "2026-02-28",
    status: "active",
    tags: ["Insurance Work", "Water Damage", "Fire Restoration", "Emergency Response"],
    notes: "24/7 emergency response. Preferred provider for NRMA, RACV, and Suncorp insurance claims.",
    annualRevenue: 3200000,
    employeeCount: 22,
    createdAt: "2024-01-08",
    lastContact: "2025-11-29",
  },
];

// ============================================================================
// AUSTRALIAN TRADE PROJECTS
// ============================================================================

export interface TradeProject {
  id: string;
  clientId: string;
  name: string;
  description: string;
  projectType: string;
  status: 'quoted' | 'approved' | 'in-progress' | 'on-hold' | 'completed' | 'invoiced';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  quoteValue: number;
  approvedValue?: number;
  invoicedValue?: number;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  startDate?: string;
  expectedCompletion?: string;
  actualCompletion?: string;
  siteContact?: string;
  siteContactPhone?: string;
  permitRequired: boolean;
  permitNumber?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const demoTradeProjects: TradeProject[] = [
  {
    id: "proj-001",
    clientId: "tc-001",
    name: "Macquarie Centre Strata - Hot Water Replacement",
    description: "Replace 24 commercial hot water systems across 3 strata buildings. Includes asbestos assessment for old pipe lagging.",
    projectType: "Commercial Hot Water",
    status: "in-progress",
    priority: "high",
    quoteValue: 187500,
    approvedValue: 182000,
    address: {
      street: "1 Waterloo Road",
      suburb: "Macquarie Park",
      state: "NSW",
      postcode: "2113",
    },
    startDate: "2025-11-15",
    expectedCompletion: "2026-01-31",
    siteContact: "Building Manager - Graham Peters",
    siteContactPhone: "+61 2 9888 7777",
    permitRequired: true,
    permitNumber: "RYDE-2025-PLM-4521",
    tags: ["Strata", "Commercial", "Hot Water", "Asbestos"],
    createdAt: "2025-10-20",
    updatedAt: "2025-11-28",
  },
  {
    id: "proj-002",
    clientId: "tc-002",
    name: "Bunnings Dandenong - Solar & Battery Installation",
    description: "450kW commercial solar array with 200kWh battery storage. Grid connection and metering upgrades required.",
    projectType: "Commercial Solar",
    status: "approved",
    priority: "medium",
    quoteValue: 685000,
    approvedValue: 672500,
    address: {
      street: "580 Princes Highway",
      suburb: "Dandenong",
      state: "VIC",
      postcode: "3175",
    },
    startDate: "2025-12-02",
    expectedCompletion: "2026-03-15",
    siteContact: "Store Manager - Rachel Kim",
    siteContactPhone: "+61 3 9794 0000",
    permitRequired: true,
    permitNumber: "CGD-2025-EL-8921",
    tags: ["Solar", "Battery", "Commercial", "High-Value"],
    createdAt: "2025-09-15",
    updatedAt: "2025-11-25",
  },
  {
    id: "proj-003",
    clientId: "tc-003",
    name: "Brisbane Airport DFO - HVAC Upgrade",
    description: "Complete HVAC system replacement for 8,500sqm retail space. VRV system installation with BMS integration.",
    projectType: "Commercial HVAC",
    status: "in-progress",
    priority: "urgent",
    quoteValue: 892000,
    approvedValue: 875000,
    invoicedValue: 350000,
    address: {
      street: "1 Airport Drive",
      suburb: "Brisbane Airport",
      state: "QLD",
      postcode: "4008",
    },
    startDate: "2025-10-01",
    expectedCompletion: "2026-02-28",
    siteContact: "Centre Manager - Andrew Blake",
    siteContactPhone: "+61 7 3406 3000",
    permitRequired: true,
    permitNumber: "BCC-2025-HVAC-3421",
    tags: ["Airport", "Commercial", "VRV", "BMS Integration"],
    createdAt: "2025-07-22",
    updatedAt: "2025-11-27",
  },
  {
    id: "proj-004",
    clientId: "tc-004",
    name: "Perth Hills Luxury Residence - New Build",
    description: "5-bedroom luxury home with infinity pool, wine cellar, and smart home automation. Bushfire rated BAL-40.",
    projectType: "Residential New Build",
    status: "in-progress",
    priority: "high",
    quoteValue: 2450000,
    approvedValue: 2380000,
    invoicedValue: 1190000,
    address: {
      street: "Lot 42 Ridgeview Estate",
      suburb: "Mundaring",
      state: "WA",
      postcode: "6073",
    },
    startDate: "2025-06-15",
    expectedCompletion: "2026-04-30",
    siteContact: "Homeowner - Dr. Patricia Chen",
    siteContactPhone: "+61 8 9295 1234",
    permitRequired: true,
    permitNumber: "MND-2025-BA-2847",
    tags: ["Luxury", "New Build", "BAL-40", "Smart Home"],
    createdAt: "2025-02-10",
    updatedAt: "2025-11-26",
  },
  {
    id: "proj-005",
    clientId: "tc-005",
    name: "Lismore Flood Recovery - Commercial Building",
    description: "Complete restoration of 3-storey commercial building after 2024 flood. Structural drying, mould remediation, and full rebuild.",
    projectType: "Flood Restoration",
    status: "in-progress",
    priority: "urgent",
    quoteValue: 485000,
    approvedValue: 478000,
    invoicedValue: 287000,
    address: {
      street: "28 Magellan Street",
      suburb: "Lismore",
      state: "NSW",
      postcode: "2480",
    },
    startDate: "2025-08-01",
    expectedCompletion: "2026-01-15",
    siteContact: "Insurance Assessor - Tony Morrison",
    siteContactPhone: "+61 2 6621 0000",
    permitRequired: true,
    permitNumber: "LIS-2025-REST-1847",
    tags: ["Insurance", "Flood", "Commercial", "Mould Remediation"],
    createdAt: "2025-07-15",
    updatedAt: "2025-11-29",
  },
  {
    id: "proj-006",
    clientId: "tc-001",
    name: "Olympic Park Apartments - Backflow Prevention",
    description: "Install testable backflow prevention devices to 156 units. Annual testing contract included.",
    projectType: "Backflow Prevention",
    status: "quoted",
    priority: "medium",
    quoteValue: 78500,
    address: {
      street: "15 Australia Avenue",
      suburb: "Sydney Olympic Park",
      state: "NSW",
      postcode: "2127",
    },
    siteContact: "Strata Manager - Lisa Wong",
    siteContactPhone: "+61 2 9714 2500",
    permitRequired: false,
    tags: ["Strata", "Backflow", "Maintenance Contract"],
    createdAt: "2025-11-20",
    updatedAt: "2025-11-28",
  },
  {
    id: "proj-007",
    clientId: "tc-002",
    name: "Chadstone Shopping Centre - EV Charging Hub",
    description: "Install 48 Tesla Superchargers and 24 destination chargers. HV switchboard upgrade required.",
    projectType: "EV Infrastructure",
    status: "approved",
    priority: "high",
    quoteValue: 1250000,
    approvedValue: 1185000,
    address: {
      street: "1341 Dandenong Road",
      suburb: "Chadstone",
      state: "VIC",
      postcode: "3148",
    },
    startDate: "2026-01-15",
    expectedCompletion: "2026-06-30",
    siteContact: "Facilities Director - Mark Stevens",
    siteContactPhone: "+61 3 9563 3355",
    permitRequired: true,
    permitNumber: "SCC-2025-EV-9912",
    tags: ["EV Charging", "Tesla", "Commercial", "High-Value"],
    createdAt: "2025-10-05",
    updatedAt: "2025-11-22",
  },
  {
    id: "proj-008",
    clientId: "tc-003",
    name: "Woolworths Springwood - Refrigeration Maintenance",
    description: "12-month refrigeration maintenance contract. Monthly preventive maintenance and 24/7 emergency callout.",
    projectType: "Maintenance Contract",
    status: "in-progress",
    priority: "medium",
    quoteValue: 86400,
    approvedValue: 82000,
    invoicedValue: 41000,
    address: {
      street: "Springwood Plaza, 257 Springwood Road",
      suburb: "Springwood",
      state: "QLD",
      postcode: "4127",
    },
    startDate: "2025-07-01",
    expectedCompletion: "2026-06-30",
    siteContact: "Store Manager - Paul Dimitriou",
    siteContactPhone: "+61 7 3290 1500",
    permitRequired: false,
    tags: ["Woolworths", "Refrigeration", "Maintenance", "Recurring"],
    createdAt: "2025-06-15",
    updatedAt: "2025-11-27",
  },
  {
    id: "proj-009",
    clientId: "tc-004",
    name: "Cottesloe Beachfront - Heritage Renovation",
    description: "Full renovation of 1920s heritage home. Retain original features while modernising infrastructure.",
    projectType: "Heritage Renovation",
    status: "on-hold",
    priority: "low",
    quoteValue: 1850000,
    address: {
      street: "89 Marine Parade",
      suburb: "Cottesloe",
      state: "WA",
      postcode: "6011",
    },
    siteContact: "Homeowner - Robert Hancock",
    siteContactPhone: "+61 8 9385 1234",
    permitRequired: true,
    tags: ["Heritage", "Renovation", "Beachfront", "On Hold"],
    createdAt: "2025-09-01",
    updatedAt: "2025-11-15",
  },
  {
    id: "proj-010",
    clientId: "tc-005",
    name: "Central Coast Fire Damage - Residential",
    description: "Full restoration of fire-damaged 4-bedroom home. Smoke damage, structural repairs, and complete interior rebuild.",
    projectType: "Fire Restoration",
    status: "completed",
    priority: "urgent",
    quoteValue: 312000,
    approvedValue: 298500,
    invoicedValue: 298500,
    address: {
      street: "45 Bushfire Lane",
      suburb: "Woy Woy",
      state: "NSW",
      postcode: "2256",
    },
    startDate: "2025-06-01",
    actualCompletion: "2025-10-28",
    siteContact: "Homeowner - Angela Murray",
    siteContactPhone: "+61 2 4341 5678",
    permitRequired: true,
    permitNumber: "CCC-2025-FIRE-3287",
    tags: ["Fire", "Insurance", "Residential", "Complete"],
    createdAt: "2025-05-15",
    updatedAt: "2025-10-28",
  },
];

// ============================================================================
// AUSTRALIAN TRADE TASKS
// ============================================================================

export interface TradeTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const demoTradeTasks: TradeTask[] = [
  {
    id: "task-001",
    projectId: "proj-001",
    title: "Complete asbestos assessment report",
    description: "Await NATA-accredited laboratory results for pipe lagging samples taken from Building A.",
    status: "in-progress",
    priority: "urgent",
    assignee: "Marcus O'Brien",
    dueDate: "2025-12-05",
    estimatedHours: 4,
    tags: ["Asbestos", "Compliance", "Documentation"],
    createdAt: "2025-11-20",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-002",
    projectId: "proj-001",
    title: "Order Rheem commercial hot water units (x24)",
    description: "Procurement of 24x Rheem 315L Commercial Electric units. Confirm delivery schedule with supplier.",
    status: "completed",
    priority: "high",
    assignee: "James Patterson",
    dueDate: "2025-11-25",
    completedDate: "2025-11-23",
    estimatedHours: 2,
    actualHours: 1.5,
    tags: ["Procurement", "Equipment"],
    createdAt: "2025-11-15",
    updatedAt: "2025-11-23",
  },
  {
    id: "task-003",
    projectId: "proj-002",
    title: "Submit solar panel layout to AusGrid",
    description: "Lodge detailed panel layout drawings with AusGrid for grid connection approval. 450kW system.",
    status: "pending",
    priority: "high",
    assignee: "David Nguyen",
    dueDate: "2025-12-01",
    estimatedHours: 8,
    tags: ["Solar", "Grid Connection", "Approval"],
    createdAt: "2025-11-22",
    updatedAt: "2025-11-22",
  },
  {
    id: "task-004",
    projectId: "proj-002",
    title: "Coordinate with structural engineer for roof loading",
    description: "Verify roof can support additional 45 tonnes of solar infrastructure. Obtain engineer's certification.",
    status: "in-progress",
    priority: "high",
    assignee: "Kevin Chen",
    dueDate: "2025-11-30",
    estimatedHours: 6,
    actualHours: 3,
    tags: ["Structural", "Engineering", "Certification"],
    createdAt: "2025-11-18",
    updatedAt: "2025-11-26",
  },
  {
    id: "task-005",
    projectId: "proj-003",
    title: "Commission new VRV outdoor units",
    description: "Complete commissioning of 8x Daikin VRV IV outdoor units. Test refrigerant charge and run diagnostics.",
    status: "in-progress",
    priority: "urgent",
    assignee: "Sarah Thompson",
    dueDate: "2025-12-02",
    estimatedHours: 16,
    actualHours: 10,
    tags: ["HVAC", "Commissioning", "Daikin"],
    createdAt: "2025-11-25",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-006",
    projectId: "proj-003",
    title: "Integrate BMS with existing Schneider system",
    description: "Program and test BMS integration for all new HVAC equipment. Configure alarms and schedules.",
    status: "pending",
    priority: "high",
    assignee: "Tom Zhang",
    dueDate: "2025-12-15",
    estimatedHours: 24,
    tags: ["BMS", "Integration", "Schneider"],
    createdAt: "2025-11-20",
    updatedAt: "2025-11-20",
  },
  {
    id: "task-007",
    projectId: "proj-004",
    title: "Pour infinity pool shell",
    description: "Coordinate concrete pour for 15m infinity edge pool. Weather dependent - backup date 8th Dec.",
    status: "pending",
    priority: "high",
    assignee: "Michael Fitzgerald",
    dueDate: "2025-12-05",
    estimatedHours: 12,
    tags: ["Pool", "Concrete", "Weather Dependent"],
    createdAt: "2025-11-26",
    updatedAt: "2025-11-26",
  },
  {
    id: "task-008",
    projectId: "proj-004",
    title: "Install Control4 smart home system",
    description: "Full smart home automation installation including lighting, HVAC, security, and AV integration.",
    status: "pending",
    priority: "medium",
    assignee: "Brett Williams",
    dueDate: "2026-02-15",
    estimatedHours: 80,
    tags: ["Smart Home", "Control4", "Automation"],
    createdAt: "2025-11-20",
    updatedAt: "2025-11-20",
  },
  {
    id: "task-009",
    projectId: "proj-005",
    title: "Complete mould remediation certification",
    description: "Obtain third-party certification that all mould has been successfully remediated. Required for insurance.",
    status: "in-progress",
    priority: "urgent",
    assignee: "Jennifer Walsh",
    dueDate: "2025-12-01",
    estimatedHours: 8,
    actualHours: 5,
    tags: ["Mould", "Certification", "Insurance"],
    createdAt: "2025-11-22",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-010",
    projectId: "proj-005",
    title: "Rebuild ground floor commercial fitout",
    description: "Complete internal fitout of ground floor retail space including new flooring, walls, and ceiling.",
    status: "pending",
    priority: "high",
    assignee: "Steve Morrison",
    dueDate: "2025-12-20",
    estimatedHours: 120,
    tags: ["Fitout", "Commercial", "Rebuild"],
    createdAt: "2025-11-25",
    updatedAt: "2025-11-25",
  },
  {
    id: "task-011",
    projectId: "proj-006",
    title: "Submit quote to strata committee",
    description: "Prepare and present detailed quote for backflow prevention installation to strata AGM.",
    status: "pending",
    priority: "medium",
    assignee: "Marcus O'Brien",
    dueDate: "2025-12-10",
    estimatedHours: 4,
    tags: ["Quote", "Strata", "Presentation"],
    createdAt: "2025-11-27",
    updatedAt: "2025-11-27",
  },
  {
    id: "task-012",
    projectId: "proj-007",
    title: "Finalise Tesla Supercharger contract",
    description: "Review and sign Tesla commercial partnership agreement for Supercharger installation.",
    status: "completed",
    priority: "high",
    assignee: "David Nguyen",
    dueDate: "2025-11-22",
    completedDate: "2025-11-20",
    estimatedHours: 3,
    actualHours: 2,
    tags: ["Contract", "Tesla", "Commercial"],
    createdAt: "2025-11-15",
    updatedAt: "2025-11-20",
  },
  {
    id: "task-013",
    projectId: "proj-008",
    title: "Monthly refrigeration service - November",
    description: "Complete scheduled preventive maintenance on all refrigeration units. Log temperatures and check gas levels.",
    status: "completed",
    priority: "medium",
    assignee: "Cameron White",
    dueDate: "2025-11-28",
    completedDate: "2025-11-27",
    estimatedHours: 6,
    actualHours: 5.5,
    tags: ["Maintenance", "Refrigeration", "Scheduled"],
    createdAt: "2025-11-01",
    updatedAt: "2025-11-27",
  },
  {
    id: "task-014",
    projectId: "proj-003",
    title: "Order copper pipe and fittings",
    description: "Procurement of 500m refrigerant-grade copper pipe and brazed fittings for VRV installation.",
    status: "completed",
    priority: "high",
    assignee: "Jason Lee",
    dueDate: "2025-11-20",
    completedDate: "2025-11-18",
    estimatedHours: 2,
    actualHours: 1.5,
    tags: ["Procurement", "Materials", "Copper"],
    createdAt: "2025-11-10",
    updatedAt: "2025-11-18",
  },
  {
    id: "task-015",
    projectId: "proj-004",
    title: "Install BAL-40 bushfire rated windows",
    description: "Install all bushfire-rated windows and doors. Ensure compliance with AS3959 BAL-40 requirements.",
    status: "in-progress",
    priority: "high",
    assignee: "Chris Anderson",
    dueDate: "2025-12-15",
    estimatedHours: 48,
    actualHours: 32,
    tags: ["BAL-40", "Windows", "Bushfire", "Compliance"],
    createdAt: "2025-11-15",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-016",
    projectId: "proj-010",
    title: "Final inspection and handover",
    description: "Complete final building inspection and hand over keys to homeowner. Provide all warranties and manuals.",
    status: "completed",
    priority: "high",
    assignee: "Jennifer Walsh",
    dueDate: "2025-10-28",
    completedDate: "2025-10-28",
    estimatedHours: 4,
    actualHours: 3,
    tags: ["Handover", "Inspection", "Complete"],
    createdAt: "2025-10-25",
    updatedAt: "2025-10-28",
  },
  {
    id: "task-017",
    projectId: "proj-001",
    title: "Schedule after-hours installation",
    description: "Coordinate with building management for after-hours access. Hot water installation requires service isolation.",
    status: "in-progress",
    priority: "medium",
    assignee: "Peter Chang",
    dueDate: "2025-12-08",
    estimatedHours: 2,
    tags: ["Scheduling", "After Hours", "Coordination"],
    createdAt: "2025-11-26",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-018",
    projectId: "proj-007",
    title: "Complete HV switchboard design",
    description: "Finalise high voltage switchboard design for EV charging hub. Submit to Ausgrid for approval.",
    status: "pending",
    priority: "high",
    assignee: "Kevin Chen",
    dueDate: "2025-12-10",
    estimatedHours: 20,
    tags: ["HV", "Switchboard", "Design", "Ausgrid"],
    createdAt: "2025-11-28",
    updatedAt: "2025-11-28",
  },
  {
    id: "task-019",
    projectId: "proj-005",
    title: "Order replacement floor joists",
    description: "Procurement of treated pine floor joists for flood-damaged ground floor structural repairs.",
    status: "completed",
    priority: "urgent",
    assignee: "Steve Morrison",
    dueDate: "2025-11-25",
    completedDate: "2025-11-24",
    estimatedHours: 2,
    actualHours: 1.5,
    tags: ["Procurement", "Structural", "Flood Damage"],
    createdAt: "2025-11-22",
    updatedAt: "2025-11-24",
  },
  {
    id: "task-020",
    projectId: "proj-002",
    title: "Install battery storage system",
    description: "Install and commission 200kWh Tesla Megapack battery storage. Coordinate with Bunnings for loading dock access.",
    status: "pending",
    priority: "medium",
    assignee: "David Nguyen",
    dueDate: "2026-02-28",
    estimatedHours: 40,
    tags: ["Battery", "Tesla", "Storage", "Installation"],
    createdAt: "2025-11-28",
    updatedAt: "2025-11-28",
  },
];

// ============================================================================
// SAMPLE INVOICES
// ============================================================================

export interface TradeInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  gst: number;
  total: number;
  paidAmount: number;
  notes?: string;
}

export const demoTradeInvoices: TradeInvoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "CWP-2025-0847",
    projectId: "proj-001",
    clientId: "tc-001",
    issueDate: "2025-11-25",
    dueDate: "2025-12-25",
    status: "sent",
    lineItems: [
      { description: "Rheem 315L Commercial Electric HWS (x12)", quantity: 12, unitPrice: 2850, total: 34200 },
      { description: "Installation labour - Licensed plumber", quantity: 96, unitPrice: 125, total: 12000 },
      { description: "Copper pipe and fittings", quantity: 1, unitPrice: 4500, total: 4500 },
      { description: "Asbestos removal - licensed contractor", quantity: 1, unitPrice: 8500, total: 8500 },
    ],
    subtotal: 59200,
    gst: 5920,
    total: 65120,
    paidAmount: 0,
    notes: "Progress claim 1 of 3. Payment due within 30 days.",
  },
  {
    id: "inv-002",
    invoiceNumber: "BSE-2025-1294",
    projectId: "proj-002",
    clientId: "tc-002",
    issueDate: "2025-11-20",
    dueDate: "2025-12-20",
    status: "paid",
    lineItems: [
      { description: "Solar panel supply - Jinko Tiger Neo 570W (x790)", quantity: 790, unitPrice: 285, total: 225150 },
      { description: "Mounting system - flat roof ballasted", quantity: 1, unitPrice: 45000, total: 45000 },
      { description: "Deposit - installation labour", quantity: 1, unitPrice: 35000, total: 35000 },
    ],
    subtotal: 305150,
    gst: 30515,
    total: 335665,
    paidAmount: 335665,
    notes: "Deposit invoice. Balance due upon completion.",
  },
  {
    id: "inv-003",
    invoiceNumber: "PAC-2025-0521",
    projectId: "proj-003",
    clientId: "tc-003",
    issueDate: "2025-11-27",
    dueDate: "2025-12-27",
    status: "viewed",
    lineItems: [
      { description: "Daikin VRV IV outdoor unit - 56kW (x8)", quantity: 8, unitPrice: 28500, total: 228000 },
      { description: "Indoor cassette units - 7.1kW (x48)", quantity: 48, unitPrice: 1850, total: 88800 },
      { description: "Refrigerant grade copper pipe installation", quantity: 500, unitPrice: 45, total: 22500 },
      { description: "BMS integration and programming", quantity: 40, unitPrice: 185, total: 7400 },
    ],
    subtotal: 346700,
    gst: 34670,
    total: 381370,
    paidAmount: 0,
    notes: "Progress claim 2 of 3. Equipment delivery and partial installation complete.",
  },
];

// ============================================================================
// SAMPLE PROPOSALS
// ============================================================================

export interface TradeProposal {
  id: string;
  proposalNumber: string;
  clientId: string;
  title: string;
  description: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  validUntil: string;
  createdDate: string;
  sections: {
    title: string;
    content: string;
  }[];
  pricing: {
    description: string;
    amount: number;
  }[];
  totalExGst: number;
  gst: number;
  totalIncGst: number;
  termsAndConditions: string;
}

export const demoTradeProposals: TradeProposal[] = [
  {
    id: "prop-001",
    proposalNumber: "CWP-PROP-2025-0089",
    clientId: "tc-001",
    title: "Olympic Park Apartments - Backflow Prevention Installation",
    description: "Comprehensive proposal for installation and annual testing of backflow prevention devices across 156 residential units.",
    status: "sent",
    validUntil: "2025-12-31",
    createdDate: "2025-11-20",
    sections: [
      {
        title: "Scope of Works",
        content: "Supply and install testable dual check valve (DCVA) backflow prevention devices to each of the 156 units. All devices will be registered with Sydney Water and tagged for annual testing compliance."
      },
      {
        title: "Compliance Requirements",
        content: "All installations will comply with AS/NZS 3500.1 and Sydney Water requirements. Annual testing will be conducted by a licensed backflow tester and results submitted to Sydney Water Backflow Registration System."
      },
      {
        title: "Project Timeline",
        content: "Installation to be completed over 8 weeks with minimal disruption to residents. Work will be scheduled in blocks of 20 units per week during standard business hours."
      },
    ],
    pricing: [
      { description: "Wilkins 720A DCVA devices (156 units)", amount: 38844 },
      { description: "Installation labour (312 hours @ $125/hr)", amount: 39000 },
      { description: "Sydney Water registration fees", amount: 2340 },
      { description: "First year annual testing included", amount: 0 },
    ],
    totalExGst: 80184,
    gst: 8018,
    totalIncGst: 88202,
    termsAndConditions: "50% deposit required upon acceptance. Balance due upon completion. 12-month warranty on all workmanship. Annual testing contract available for $6,500 + GST per year.",
  },
  {
    id: "prop-002",
    proposalNumber: "ICG-PROP-2025-0124",
    clientId: "tc-004",
    title: "Cottesloe Heritage Renovation - Concept Design",
    description: "Preliminary proposal for heritage renovation of 1920s beachfront residence including restoration of original features and modern infrastructure integration.",
    status: "viewed",
    validUntil: "2025-12-15",
    createdDate: "2025-09-01",
    sections: [
      {
        title: "Heritage Considerations",
        content: "The property is listed on the Heritage Council of Western Australia register. All works will be conducted in accordance with heritage guidelines and the Burra Charter. Original jarrah flooring, leadlight windows, and ornate ceiling roses will be preserved and restored."
      },
      {
        title: "Modernisation Works",
        content: "Discrete integration of modern infrastructure including concealed electrical and data cabling, hydronic heating, new plumbing to kitchens and bathrooms, and smart home automation. All modern additions designed to be reversible and minimally invasive."
      },
      {
        title: "Proposed Timeline",
        content: "12-month construction period following 3-month detailed design and heritage approval phase. Project commencement subject to Heritage Council approval (typically 8-12 weeks)."
      },
    ],
    pricing: [
      { description: "Heritage restoration works", amount: 485000 },
      { description: "Structural repairs and underpinning", amount: 125000 },
      { description: "New kitchen and bathrooms (x3)", amount: 280000 },
      { description: "Electrical and smart home upgrade", amount: 165000 },
      { description: "Hydronic heating system", amount: 85000 },
      { description: "External works and landscaping", amount: 145000 },
      { description: "Project management (15%)", amount: 192750 },
    ],
    totalExGst: 1477750,
    gst: 147775,
    totalIncGst: 1625525,
    termsAndConditions: "This is a preliminary estimate only. Detailed quotation to follow upon completion of heritage assessment and detailed design. Progress payments monthly based on certified completion. PC and provisional sum items subject to variation.",
  },
];

// ============================================================================
// LEGACY TEAM MEMBERS (Updated for Australian Context)
// ============================================================================

export const demoTeamMembers = [
  {
    id: "1",
    name: "Emma Richardson",
    role: "Senior Project Manager",
    email: "emma@synthex.com.au",
    phone: "+61 2 9876 5432",
    initials: "ER",
    capacity: 85,
    hoursAllocated: 34,
    hoursAvailable: 40,
    status: "near-capacity" as const,
    currentProjects: 3,
    skills: ["Project Management", "Stakeholder Relations", "Trade Coordination"],
    joinDate: "Jan 2024",
  },
  {
    id: "2",
    name: "James Patel",
    role: "Digital Marketing Lead",
    email: "james@synthex.com.au",
    phone: "+61 3 9012 3456",
    initials: "JP",
    capacity: 60,
    hoursAllocated: 24,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
    skills: ["SEO", "Google Ads", "Trade Marketing"],
    joinDate: "Mar 2024",
  },
  {
    id: "3",
    name: "Sophie Chen",
    role: "Content Producer",
    email: "sophie@synthex.com.au",
    phone: "+61 7 3456 7890",
    initials: "SC",
    capacity: 105,
    hoursAllocated: 42,
    hoursAvailable: 40,
    status: "over-capacity" as const,
    currentProjects: 4,
    skills: ["Video Production", "Case Studies", "Social Media"],
    joinDate: "Feb 2024",
  },
  {
    id: "4",
    name: "Ryan McAllister",
    role: "Technical Lead",
    email: "ryan@synthex.com.au",
    phone: "+61 8 9234 5678",
    initials: "RM",
    capacity: 70,
    hoursAllocated: 28,
    hoursAvailable: 40,
    status: "available" as const,
    currentProjects: 2,
    skills: ["Next.js", "TypeScript", "API Integration"],
    joinDate: "Dec 2023",
  },
];

// ============================================================================
// LEGACY CONTACTS (Updated for Australian Trade Industry)
// ============================================================================

export const demoContacts = [
  {
    id: "1",
    firstName: "Marcus",
    lastName: "O'Brien",
    email: "marcus@clearwaterplumbing.com.au",
    company: "Clearwater Plumbing Solutions",
    role: "Managing Director",
    status: "active",
    tags: ["High-Value", "Decision Maker", "Plumbing"],
    lastContact: "2025-11-28",
  },
  {
    id: "2",
    firstName: "David",
    lastName: "Nguyen",
    email: "david@brightsparkelectrical.com.au",
    company: "Brightspark Electrical Services",
    role: "Owner",
    status: "active",
    tags: ["Solar", "Commercial", "Electrical"],
    lastContact: "2025-11-25",
  },
  {
    id: "3",
    firstName: "Sarah",
    lastName: "Thompson",
    email: "sarah@polaraircon.com.au",
    company: "Polar Climate Control",
    role: "Operations Manager",
    status: "active",
    tags: ["HVAC", "Maintenance Contracts", "Commercial"],
    lastContact: "2025-11-27",
  },
  {
    id: "4",
    firstName: "Michael",
    lastName: "Fitzgerald",
    email: "mfitzgerald@ironbarkconstruction.com.au",
    company: "Ironbark Construction Group",
    role: "Director",
    status: "active",
    tags: ["Building", "Residential", "High-Value"],
    lastContact: "2025-11-26",
  },
  {
    id: "5",
    firstName: "Jennifer",
    lastName: "Walsh",
    email: "jenny@floodfix.com.au",
    company: "FloodFix Restoration Services",
    role: "Business Development Manager",
    status: "active",
    tags: ["Insurance Work", "Restoration", "Emergency"],
    lastContact: "2025-11-29",
  },
];

// ============================================================================
// DEMO CAMPAIGNS (Updated for Trade Industry)
// ============================================================================

export const demoCampaigns = [
  {
    id: "1",
    name: "Summer Safety Compliance Reminder",
    status: "active",
    type: "email",
    sentCount: 842,
    openRate: 48.3,
    clickRate: 22.7,
    startDate: "2025-11-15",
    endDate: "2025-12-31",
  },
  {
    id: "2",
    name: "Trade Show Follow-up - Build Expo 2025",
    status: "scheduled",
    type: "email",
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    startDate: "2025-12-05",
    endDate: "2025-12-20",
  },
  {
    id: "3",
    name: "Monthly Newsletter - November",
    status: "completed",
    type: "email",
    sentCount: 1245,
    openRate: 42.1,
    clickRate: 18.4,
    startDate: "2025-11-01",
    endDate: "2025-11-07",
  },
];

// ============================================================================
// DEMO WORKSPACES (Updated for Trade Focus)
// ============================================================================

export const demoWorkspaces = [
  {
    id: "1",
    name: "Trade Clients",
    description: "Plumbing, electrical, and HVAC service providers",
    memberCount: 5,
    projectCount: 28,
    color: "#3b9ba8",
  },
  {
    id: "2",
    name: "Building & Construction",
    description: "Builders, renovators, and construction companies",
    memberCount: 4,
    projectCount: 15,
    color: "#f39c12",
  },
  {
    id: "3",
    name: "Restoration Services",
    description: "Fire, flood, and disaster restoration specialists",
    memberCount: 3,
    projectCount: 12,
    color: "#2563ab",
  },
];

// ============================================================================
// DEMO SETTINGS (Updated for Australian Context)
// ============================================================================

export const demoSettings = {
  organization: {
    name: "Synthex Digital Pty Ltd",
    abn: "12 345 678 901",
    email: "hello@synthex.com.au",
    website: "https://synthex.com.au",
    timezone: "Australia/Sydney",
    address: {
      street: "Level 5, 123 Pitt Street",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
    },
  },
  user: {
    name: "Phill Harris",
    email: "phill@synthex.com.au",
    role: "founder",
    initials: "PH",
  },
  preferences: {
    emailNotifications: true,
    desktopNotifications: false,
    weeklyReports: true,
    theme: "light",
    currency: "AUD",
    dateFormat: "DD/MM/YYYY",
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
  if (typeof window === "undefined") {
return;
}

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
  if (typeof window === "undefined") {
return;
}

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
