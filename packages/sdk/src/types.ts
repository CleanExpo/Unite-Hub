/** Configuration for the Unite-Group SDK client */
export interface UniteHubConfig {
  /** Base URL of the Unite-Group API (e.g. https://unite-group.in/api) */
  baseUrl: string;
  /** API key for authentication (from Project Connect) */
  apiKey: string;
}

/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

/** Contact record */
export interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  job_title?: string;
  ai_score: number;
  status: 'prospect' | 'lead' | 'customer' | 'contact';
  tags: string[];
  last_interaction?: string;
  created_at: string;
  updated_at: string;
}

/** Create contact input */
export interface CreateContactInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  job_title?: string;
  status?: Contact['status'];
  tags?: string[];
}

/** Update contact input */
export interface UpdateContactInput {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  job_title?: string;
  status?: Contact['status'];
  tags?: string[];
}

/** Project Connect event */
export interface ProjectEvent {
  id: string;
  project_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  source: string;
  created_at: string;
}

/** Create event input */
export interface CreateEventInput {
  project_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
  source?: string;
}

/** Vault credential (agent access) */
export interface VaultCredential {
  id: string;
  service_name: string;
  credential_type: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/** Vault credential value (decrypted) */
export interface VaultCredentialValue {
  id: string;
  service_name: string;
  value: string;
}

/** SDK error with status code */
export class UniteHubError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'UniteHubError';
  }
}
