/**
 * Approval Module
 *
 * Exports approval service and types for Client-In-The-Loop governance.
 */

export {
  approvalService,
  getApprovalService,
  ApprovalService,
} from './approvalService';

export type {
  ApprovalStatus,
  ApprovalSource,
  ApprovalRequest,
  ApprovalHistoryEvent,
  ApprovalCreateInput,
  ApprovalUpdateInput,
  ApprovalListFilters,
  ApprovalStats,
} from './approvalTypes';
