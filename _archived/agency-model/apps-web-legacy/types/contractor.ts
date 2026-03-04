/**
 * Contractor API Types
 *
 * TypeScript types matching Pydantic models from backend.
 * Maintains Australian context (DD/MM/YYYY, ABN, mobile formats).
 */

export type AustralianState = "QLD" | "NSW" | "VIC" | "SA" | "WA" | "TAS" | "NT" | "ACT";

export type AvailabilityStatus = "available" | "booked" | "tentative" | "unavailable";

export interface Location {
  suburb: string;
  state: AustralianState;
  postcode?: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string; // ISO 8601 format with timezone (AEST)
  startTime: string; // HH:MM:SS format
  endTime: string; // HH:MM:SS format
  location: Location;
  status: AvailabilityStatus;
  notes?: string;
}

export interface Contractor {
  id: string;
  name: string;
  mobile: string; // Australian format: 04XX XXX XXX
  abn?: string; // Australian format: XX XXX XXX XXX
  email?: string;
  specialisation?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  availabilitySlots: AvailabilitySlot[];
}

export interface ContractorCreate {
  name: string;
  mobile: string;
  abn?: string;
  email?: string;
  specialisation?: string;
}

export interface ContractorUpdate {
  name?: string;
  mobile?: string;
  abn?: string;
  email?: string;
  specialisation?: string;
}

export interface AvailabilitySlotCreate {
  contractorId: string;
  date: string; // ISO 8601 format
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  location: Location;
  status: AvailabilityStatus;
  notes?: string;
}

export interface ContractorListResponse {
  contractors: Contractor[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}
