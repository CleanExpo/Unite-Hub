/**
 * CRM TYPE DEFINITIONS
 * 
 * TypeScript definitions for CRM entities and business logic
 */

// Deal Status Enumeration
export type DealStatus = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

// Task Status Enumeration  
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// Task Priority Enumeration
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Client/Customer Interface
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: 'active' | 'inactive' | 'prospect';
  created_at: string;
  updated_at: string;
  total_revenue?: number;
  last_contact?: string;
}

// Deal Interface
export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  client_id: string;
  status: DealStatus;
  expected_close_date?: string;
  probability: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

// Task Interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  client_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Activity Interface
export interface Activity {
  id: string;
  type: string;
  description: string;
  related_to: 'client' | 'deal' | 'task' | 'meeting';
  related_id: string;
  user_id: string;
  timestamp: string;
}

// Invoice Interface
export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

// Meeting Interface
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  client_id?: string;
  deal_id?: string;
  attendees?: string[];
  location?: string;
  meeting_url?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Analytics Interfaces
export interface DealAnalytics {
  totalValue: number;
  averageValue: number;
  count: number;
  weightedValue: number;
  conversionRate: number;
  stageDistribution: Record<DealStatus, number>;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  priorityDistribution: Record<TaskPriority, number>;
  overdueTasks: number;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  monthlyTrend: { month: string; revenue: number; invoices: number }[];
}

// Dashboard Data Interface
export interface DashboardData {
  dealsCount: number;
  revenue: number;
  tasksCount: number;
  activitiesCount: number;
  pipelineData: { status: DealStatus; count: number; value: number }[];
  recentActivities: Activity[];
  clientsCount: number;
  activeClientsCount: number;
  newClientsThisMonth: number;
  completedTasksCount: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  pipelineValue: number;
  conversionRate: number;
  taskCompletionRate: number;
}

// API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Data Interfaces
export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface CreateDealData {
  title: string;
  description?: string;
  value: number;
  client_id: string;
  expected_close_date?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  client_id?: string;
  deal_id?: string;
}

export interface CreateInvoiceData {
  client_id: string;
  amount: number;
  due_date: string;
  description?: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  client_id?: string;
  deal_id?: string;
  location?: string;
  meeting_url?: string;
}

// Workflow Interfaces
export interface WorkflowResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DealWorkflowInput {
  dealId: string;
  fromStatus: DealStatus;
  toStatus: DealStatus;
  notes?: string;
  userId: string;
}

export interface TaskWorkflowInput {
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  notes?: string;
  userId: string;
}

// Filter and Search Interfaces
export interface DealFilters {
  status?: DealStatus;
  client_id?: string;
  value_min?: number;
  value_max?: number;
  created_after?: string;
  created_before?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  client_id?: string;
  deal_id?: string;
  due_after?: string;
  due_before?: string;
}

export interface ClientFilters {
  status?: 'active' | 'inactive' | 'prospect';
  search?: string;
  created_after?: string;
  created_before?: string;
}
