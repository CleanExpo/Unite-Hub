/**
 * Onboarding Flows
 *
 * Pre-defined task templates for automated onboarding processes.
 * These flows guide the auto-action engine through common onboarding scenarios.
 */

import { TaskDefinition } from './computerUseOrchestrator';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingFlowTemplate {
  id: string;
  type: TaskDefinition['type'];
  name: string;
  description: string;
  targetUrl: string;
  steps: OnboardingStep[];
  expectedOutcome: string;
  estimatedDuration: number; // in seconds
  constraints: string[];
  requiredData: string[];
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  targetElement?: string;
  action: 'navigate' | 'click' | 'type' | 'select' | 'upload' | 'wait' | 'verify';
  value?: string;
  dataField?: string; // References a key in formData
  optional?: boolean;
  criticalPoint?: boolean;
}

export interface OnboardingData {
  // Client Onboarding
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostcode?: string;
  clientCountry?: string;
  clientIndustry?: string;
  clientWebsite?: string;
  clientNotes?: string;

  // Staff Onboarding
  staffFirstName?: string;
  staffLastName?: string;
  staffEmail?: string;
  staffRole?: string;
  staffDepartment?: string;
  staffManagerEmail?: string;
  staffStartDate?: string;

  // CRM Auto-fill
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  dealTitle?: string;
  dealValue?: string;
  dealStage?: string;
  activityType?: string;
  activityNotes?: string;
}

// ============================================================================
// CLIENT ONBOARDING FLOWS
// ============================================================================

export const clientOnboardingFlow: OnboardingFlowTemplate = {
  id: 'client_onboarding_standard',
  type: 'client_onboarding',
  name: 'Client Onboarding - Standard',
  description: 'Complete standard client onboarding form with contact and company details',
  targetUrl: '/client/onboarding',
  estimatedDuration: 120,
  expectedOutcome: 'Client profile created and visible in contacts list',
  constraints: [
    'Do not submit form until all required fields are filled',
    'Verify email format before submission',
    'Wait for success message after submission',
  ],
  requiredData: ['clientName', 'clientEmail'],
  steps: [
    {
      id: 'nav_to_onboarding',
      name: 'Navigate to Onboarding',
      description: 'Go to the client onboarding page',
      action: 'navigate',
      value: '/client/onboarding',
    },
    {
      id: 'fill_client_name',
      name: 'Fill Client Name',
      description: 'Enter the client full name',
      targetElement: 'input[name="name"], input[placeholder*="name"]',
      action: 'type',
      dataField: 'clientName',
    },
    {
      id: 'fill_client_email',
      name: 'Fill Client Email',
      description: 'Enter the client email address',
      targetElement: 'input[name="email"], input[type="email"]',
      action: 'type',
      dataField: 'clientEmail',
    },
    {
      id: 'fill_client_phone',
      name: 'Fill Client Phone',
      description: 'Enter the client phone number',
      targetElement: 'input[name="phone"], input[type="tel"]',
      action: 'type',
      dataField: 'clientPhone',
      optional: true,
    },
    {
      id: 'fill_client_company',
      name: 'Fill Company Name',
      description: 'Enter the client company name',
      targetElement: 'input[name="company"], input[placeholder*="company"]',
      action: 'type',
      dataField: 'clientCompany',
      optional: true,
    },
    {
      id: 'fill_client_industry',
      name: 'Select Industry',
      description: 'Select the client industry',
      targetElement: 'select[name="industry"]',
      action: 'select',
      dataField: 'clientIndustry',
      optional: true,
    },
    {
      id: 'fill_client_website',
      name: 'Fill Website',
      description: 'Enter the client website URL',
      targetElement: 'input[name="website"], input[type="url"]',
      action: 'type',
      dataField: 'clientWebsite',
      optional: true,
    },
    {
      id: 'fill_client_notes',
      name: 'Add Notes',
      description: 'Enter any additional notes about the client',
      targetElement: 'textarea[name="notes"]',
      action: 'type',
      dataField: 'clientNotes',
      optional: true,
    },
    {
      id: 'review_form',
      name: 'Review Form',
      description: 'Review all entered information before submission',
      action: 'wait',
      value: '2000',
    },
    {
      id: 'submit_form',
      name: 'Submit Form',
      description: 'Click the submit button to create the client profile',
      targetElement: 'button[type="submit"], button:contains("Create"), button:contains("Submit")',
      action: 'click',
      criticalPoint: true,
    },
    {
      id: 'verify_success',
      name: 'Verify Success',
      description: 'Wait for and verify the success message',
      action: 'verify',
      value: 'success|created|saved',
    },
  ],
};

// ============================================================================
// STAFF ONBOARDING FLOWS
// ============================================================================

export const staffOnboardingFlow: OnboardingFlowTemplate = {
  id: 'staff_onboarding_standard',
  type: 'staff_onboarding',
  name: 'Staff Onboarding - Standard',
  description: 'Complete staff member onboarding with HR system integration',
  targetUrl: '/staff/onboarding',
  estimatedDuration: 180,
  expectedOutcome: 'Staff member profile created and assigned to department',
  constraints: [
    'Verify email domain matches company domain',
    'Manager email must exist in system',
    'Start date must be in the future',
  ],
  requiredData: ['staffFirstName', 'staffLastName', 'staffEmail', 'staffRole'],
  steps: [
    {
      id: 'nav_to_onboarding',
      name: 'Navigate to Staff Onboarding',
      description: 'Go to the staff onboarding page',
      action: 'navigate',
      value: '/staff/onboarding',
    },
    {
      id: 'fill_first_name',
      name: 'Fill First Name',
      description: 'Enter the staff member first name',
      targetElement: 'input[name="firstName"], input[placeholder*="first"]',
      action: 'type',
      dataField: 'staffFirstName',
    },
    {
      id: 'fill_last_name',
      name: 'Fill Last Name',
      description: 'Enter the staff member last name',
      targetElement: 'input[name="lastName"], input[placeholder*="last"]',
      action: 'type',
      dataField: 'staffLastName',
    },
    {
      id: 'fill_email',
      name: 'Fill Email',
      description: 'Enter the staff member email address',
      targetElement: 'input[name="email"], input[type="email"]',
      action: 'type',
      dataField: 'staffEmail',
    },
    {
      id: 'select_role',
      name: 'Select Role',
      description: 'Select the staff member role',
      targetElement: 'select[name="role"]',
      action: 'select',
      dataField: 'staffRole',
    },
    {
      id: 'select_department',
      name: 'Select Department',
      description: 'Select the staff member department',
      targetElement: 'select[name="department"]',
      action: 'select',
      dataField: 'staffDepartment',
      optional: true,
    },
    {
      id: 'fill_manager_email',
      name: 'Fill Manager Email',
      description: 'Enter the reporting manager email',
      targetElement: 'input[name="managerEmail"]',
      action: 'type',
      dataField: 'staffManagerEmail',
      optional: true,
    },
    {
      id: 'fill_start_date',
      name: 'Fill Start Date',
      description: 'Enter the staff member start date',
      targetElement: 'input[name="startDate"], input[type="date"]',
      action: 'type',
      dataField: 'staffStartDate',
      optional: true,
    },
    {
      id: 'review_form',
      name: 'Review Form',
      description: 'Review all entered information before submission',
      action: 'wait',
      value: '2000',
    },
    {
      id: 'submit_form',
      name: 'Submit Form',
      description: 'Click the submit button to create the staff profile',
      targetElement: 'button[type="submit"], button:contains("Create"), button:contains("Add")',
      action: 'click',
      criticalPoint: true,
    },
    {
      id: 'verify_success',
      name: 'Verify Success',
      description: 'Wait for and verify the success message',
      action: 'verify',
      value: 'success|created|added',
    },
  ],
};

// ============================================================================
// CRM AUTO-FILL FLOWS
// ============================================================================

export const crmContactAutofillFlow: OnboardingFlowTemplate = {
  id: 'crm_contact_autofill',
  type: 'crm_autofill',
  name: 'CRM Contact Auto-fill',
  description: 'Automatically fill contact information in CRM forms',
  targetUrl: '/dashboard/contacts/new',
  estimatedDuration: 60,
  expectedOutcome: 'Contact created in CRM with all available data',
  constraints: [
    'Email must be unique in system',
    'Do not overwrite existing contact data',
  ],
  requiredData: ['contactName', 'contactEmail'],
  steps: [
    {
      id: 'nav_to_contacts',
      name: 'Navigate to New Contact',
      description: 'Go to the new contact page',
      action: 'navigate',
      value: '/dashboard/contacts/new',
    },
    {
      id: 'fill_name',
      name: 'Fill Contact Name',
      description: 'Enter the contact name',
      targetElement: 'input[name="name"]',
      action: 'type',
      dataField: 'contactName',
    },
    {
      id: 'fill_email',
      name: 'Fill Contact Email',
      description: 'Enter the contact email',
      targetElement: 'input[name="email"]',
      action: 'type',
      dataField: 'contactEmail',
    },
    {
      id: 'fill_phone',
      name: 'Fill Contact Phone',
      description: 'Enter the contact phone',
      targetElement: 'input[name="phone"]',
      action: 'type',
      dataField: 'contactPhone',
      optional: true,
    },
    {
      id: 'save_contact',
      name: 'Save Contact',
      description: 'Click save to create the contact',
      targetElement: 'button[type="submit"]',
      action: 'click',
      criticalPoint: true,
    },
  ],
};

export const crmDealAutofillFlow: OnboardingFlowTemplate = {
  id: 'crm_deal_autofill',
  type: 'crm_autofill',
  name: 'CRM Deal Auto-fill',
  description: 'Automatically fill deal information in CRM',
  targetUrl: '/dashboard/deals/new',
  estimatedDuration: 90,
  expectedOutcome: 'Deal created in CRM with pipeline assignment',
  constraints: [
    'Contact must exist before creating deal',
    'Deal value must be positive number',
  ],
  requiredData: ['dealTitle', 'contactEmail'],
  steps: [
    {
      id: 'nav_to_deals',
      name: 'Navigate to New Deal',
      description: 'Go to the new deal page',
      action: 'navigate',
      value: '/dashboard/deals/new',
    },
    {
      id: 'fill_title',
      name: 'Fill Deal Title',
      description: 'Enter the deal title',
      targetElement: 'input[name="title"]',
      action: 'type',
      dataField: 'dealTitle',
    },
    {
      id: 'fill_value',
      name: 'Fill Deal Value',
      description: 'Enter the deal value',
      targetElement: 'input[name="value"]',
      action: 'type',
      dataField: 'dealValue',
      optional: true,
    },
    {
      id: 'select_stage',
      name: 'Select Deal Stage',
      description: 'Select the deal pipeline stage',
      targetElement: 'select[name="stage"]',
      action: 'select',
      dataField: 'dealStage',
      optional: true,
    },
    {
      id: 'link_contact',
      name: 'Link Contact',
      description: 'Link the deal to a contact',
      targetElement: 'input[name="contact"]',
      action: 'type',
      dataField: 'contactEmail',
    },
    {
      id: 'save_deal',
      name: 'Save Deal',
      description: 'Click save to create the deal',
      targetElement: 'button[type="submit"]',
      action: 'click',
      criticalPoint: true,
    },
  ],
};

// ============================================================================
// FLOW REGISTRY
// ============================================================================

export const flowRegistry: Map<string, OnboardingFlowTemplate> = new Map([
  [clientOnboardingFlow.id, clientOnboardingFlow],
  [staffOnboardingFlow.id, staffOnboardingFlow],
  [crmContactAutofillFlow.id, crmContactAutofillFlow],
  [crmDealAutofillFlow.id, crmDealAutofillFlow],
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a flow by ID
 */
export function getFlow(flowId: string): OnboardingFlowTemplate | undefined {
  return flowRegistry.get(flowId);
}

/**
 * Get all flows of a specific type
 */
export function getFlowsByType(type: TaskDefinition['type']): OnboardingFlowTemplate[] {
  return Array.from(flowRegistry.values()).filter((flow) => flow.type === type);
}

/**
 * Convert an OnboardingFlowTemplate to a TaskDefinition
 */
export function flowToTask(
  flow: OnboardingFlowTemplate,
  data: OnboardingData
): TaskDefinition {
  // Interpolate data into steps
  const stepsWithData = flow.steps.map((step) => {
    let description = step.description;
    if (step.dataField && data[step.dataField as keyof OnboardingData]) {
      description += `: ${data[step.dataField as keyof OnboardingData]}`;
    }
    return description;
  });

  return {
    id: `task_${flow.id}_${Date.now()}`,
    type: flow.type,
    name: flow.name,
    description: flow.description,
    steps: stepsWithData,
    expectedOutcome: flow.expectedOutcome,
    constraints: flow.constraints,
    formData: data as Record<string, string>,
  };
}

/**
 * Validate that required data is present for a flow
 */
export function validateFlowData(
  flow: OnboardingFlowTemplate,
  data: OnboardingData
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of flow.requiredData) {
    if (!data[field as keyof OnboardingData]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get estimated time for a flow
 */
export function getEstimatedDuration(flowId: string): number {
  const flow = flowRegistry.get(flowId);
  return flow?.estimatedDuration || 120;
}

export default {
  clientOnboardingFlow,
  staffOnboardingFlow,
  crmContactAutofillFlow,
  crmDealAutofillFlow,
  flowRegistry,
  getFlow,
  getFlowsByType,
  flowToTask,
  validateFlowData,
  getEstimatedDuration,
};
