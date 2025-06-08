// Unite Group + CARSI CRM Integration Types

export interface UnifiedCustomer {
  // Core Customer Information
  customerId: string; // Format: UG-12345
  basicInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: {
      name: string;
      size?: 'small' | 'medium' | 'large' | 'enterprise';
      industry?: string;
      website?: string;
    };
    location?: {
      country: string;
      state?: string;
      city?: string;
      timezone?: string;
    };
  };

  // Unite Group Services
  uniteServices: {
    consultationHistory: Consultation[];
    activeProjects: Project[];
    projectHistory: Project[]; // Historical projects
    servicePackages: ServicePackage[];
    billingHistory: Invoice[];
    totalSpent: number;
    preferredPaymentMethod?: string;
  };

  // CARSI Education
  carsiEducation: {
    membershipStatus: MembershipStatus;
    membershipType?: 'Basic' | 'Professional' | 'Enterprise';
    membershipExpiry?: Date;
    coursesEnrolled: CourseEnrollment[];
    coursesCompleted: CompletedCourse[];
    certificationsEarned: Certification[];
    cecCredits: {
      total: number;
      expiring: number;
      expiryDate?: Date;
    };
    learningProgress: LearningProgress[];
  };

  // CARSI Courses (alias for compatibility)
  carsiCourses: {
    currentEnrollments: CourseEnrollment[];
    courseHistory: CompletedCourse[];
  };

  // Purchase History
  purchaseHistory: {
    invoices: Invoice[];
    totalSpent: number;
    lastPurchaseDate?: Date;
    averageOrderValue: number;
  };

  // Financial Summary
  financialSummary: {
    lifetimeValue: number;
    monthlyRecurringRevenue: number;
    outstandingBalance: number;
    creditLimit?: number;
  };

  // Engagement Analytics
  engagementAnalytics: {
    combinedLTV: number; // Lifetime value across both platforms
    crossSellOpportunities: CrossSellOpportunity[];
    engagementScore: number; // 0-100
    lastActivity: Date;
    lastInteraction: Date; // Most recent interaction timestamp
    preferredContactMethod: 'email' | 'phone' | 'sms';
    communicationPreferences: {
      marketingEmails: boolean;
      courseNotifications: boolean;
      projectUpdates: boolean;
      newsletter: boolean;
    };
    supportTickets: SupportTicket[]; // Support ticket history
  };

  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    source: 'unite' | 'carsi' | 'merged';
    tags?: string[];
    notes?: string;
    bundlePurchases: number; // Number of bundle purchases
  };
}

// Unite Group Types
export interface Consultation {
  id: string;
  date: Date;
  type: 'initial' | 'follow-up' | 'strategy' | 'technical';
  duration: number; // minutes
  attendees: string[];
  notes?: string;
  outcome?: string;
  nextSteps?: string[];
}

export interface Project {
  id: string;
  name: string;
  type: 'software' | 'seo' | 'strategy' | 'qa' | 'other';
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'in-progress';
  startDate: Date;
  endDate?: Date;
  estimatedCompletion: Date;
  budget: number;
  spent: number;
  milestones: Milestone[];
  teamMembers: string[];
  satisfactionScore?: number; // 1-5
}

export interface ServicePackage {
  id: string;
  name: string;
  services: string[];
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
}

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: InvoiceItem[];
  paymentMethod?: string;
  paidDate?: Date;
}

// CARSI Types
export interface CourseEnrollment {
  courseId: string;
  courseName: string;
  courseType: 'development' | 'leadership' | 'marketing' | 'technical' | 'other';
  enrollmentDate: Date;
  enrolledAt: Date; // Alias for enrollmentDate
  progress: number; // 0-100
  status: 'active' | 'paused' | 'dropped';
  estimatedCompletion?: Date;
  completedAt?: Date;
}

export interface CompletedCourse {
  courseId: string;
  courseName: string;
  completionDate: Date;
  cecCredits: number;
  grade?: string;
  certificateUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  type: 'IICRC' | 'Industry' | 'Vendor' | 'Other';
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
  cecCredits?: number;
}

export interface LearningProgress {
  date: Date;
  coursesCompleted: number;
  hoursSpent: number;
  cecCreditsEarned: number;
  assessmentScores: number[];
}

// Support Ticket Types
export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'unresolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'general' | 'software' | 'seo' | 'strategy';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  satisfactionScore?: number; // 1-5
  messages: number;
  assignedTo?: string;
}

// Cross-selling Types
export interface CrossSellOpportunity {
  id: string;
  type: 'unite-to-carsi' | 'carsi-to-unite';
  confidence: number; // 0-100
  recommendation: string;
  reason: string;
  potentialValue: number;
  priority: 'high' | 'medium' | 'low';
}

// Bundle Offerings
export interface BundleOffering {
  id: string;
  name: string;
  description: string;
  uniteServices: string[];
  carsiCourses: string[];
  totalPrice: number;
  savings: number;
  duration?: string;
  targetAudience: string[];
}

export const BUNDLE_OFFERINGS: BundleOffering[] = [
  {
    id: 'digital-transformation',
    name: 'Digital Transformation Package',
    description: 'Complete software development with staff training',
    uniteServices: ['Software Development', 'Quality Assurance'],
    carsiCourses: ['Modern Web Development', 'DevOps Fundamentals'],
    totalPrice: 45000,
    savings: 5000,
    duration: '6 months',
    targetAudience: ['medium', 'large', 'enterprise']
  },
  {
    id: 'seo-mastery',
    name: 'SEO Mastery Bundle',
    description: 'SEO services with digital marketing certification',
    uniteServices: ['Strategic SEO'],
    carsiCourses: ['Digital Marketing Certification', 'SEO Fundamentals'],
    totalPrice: 15000,
    savings: 2000,
    duration: '3 months',
    targetAudience: ['small', 'medium']
  },
  {
    id: 'business-growth',
    name: 'Business Growth Accelerator',
    description: 'Strategy consulting with leadership development program',
    uniteServices: ['Business Strategy', 'Initial Consultation'],
    carsiCourses: ['Leadership Excellence', 'Strategic Planning'],
    totalPrice: 25000,
    savings: 3500,
    duration: '4 months',
    targetAudience: ['medium', 'large']
  }
];

// Helper Types
export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  deliverables: string[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type MembershipStatus = 'active' | 'expired' | 'pending' | 'cancelled';

// API Integration Types
export interface CRMSyncRequest {
  customerId: string;
  syncType: 'full' | 'partial' | 'delta';
  lastSyncDate?: Date;
  includeServices?: boolean;
  includeEducation?: boolean;
}

export interface CRMSyncResponse {
  success: boolean;
  customer?: UnifiedCustomer;
  errors?: string[];
  syncedAt: Date;
  nextSyncRecommended?: Date;
}

// Automation Workflow Types
export interface AutomationTrigger {
  id: string;
  name: string;
  type: 'project-complete' | 'course-complete' | 'certification-expiring' | 'milestone-reached';
  conditions: Record<string, any>;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'enroll-course' | 'send-email' | 'create-task' | 'update-crm' | 'trigger-webhook';
  parameters: Record<string, any>;
  delayMinutes?: number;
}
