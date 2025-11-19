/**
 * Client Service Layer - Phase 2 Step 6
 *
 * Wraps client API endpoints with proper error handling and type safety
 * Following patterns from docs/PHASE2_API_WIRING_COMPLETE.md
 */

// Type definitions for client data
export interface ClientIdea {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  media_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientProject {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress?: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface VaultEntry {
  id: string;
  client_id: string;
  service_name: string;
  username?: string | null;
  encrypted_password: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generic error handler for fetch responses
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error (${res.status}): ${errorText}`);
  }

  try {
    const data = await res.json();
    return data.data || data; // Handle both {data: ...} and direct response
  } catch (error) {
    throw new Error('Failed to parse API response');
  }
}

/**
 * Fetch client ideas
 */
export async function getClientIdeas(): Promise<{ data: ClientIdea[] }> {
  try {
    const res = await fetch('/api/client/ideas', { cache: 'no-store' });
    return { data: await handleResponse<ClientIdea[]>(res) };
  } catch (error) {
    console.error('Failed to fetch client ideas:', error);
    return { data: [] };
  }
}

/**
 * Create new idea
 */
export async function createIdea(idea: {
  title: string;
  description: string;
  category?: string;
  media_url?: string;
}): Promise<ClientIdea> {
  const res = await fetch('/api/client/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(idea),
  });

  return handleResponse<ClientIdea>(res);
}

/**
 * Update existing idea
 */
export async function updateIdea(id: string, updates: Partial<ClientIdea>): Promise<ClientIdea> {
  const res = await fetch('/api/client/ideas', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });

  return handleResponse<ClientIdea>(res);
}

/**
 * Delete idea
 */
export async function deleteIdea(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/client/ideas', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  return handleResponse<{ success: boolean }>(res);
}

/**
 * Fetch client projects
 */
export async function getClientProjects(): Promise<{ data: ClientProject[] }> {
  try {
    const res = await fetch('/api/client/projects', { cache: 'no-store' });
    return { data: await handleResponse<ClientProject[]>(res) };
  } catch (error) {
    console.error('Failed to fetch client projects:', error);
    return { data: [] };
  }
}

/**
 * Fetch vault entries
 */
export async function getVaultEntries(): Promise<{ data: VaultEntry[] }> {
  try {
    const res = await fetch('/api/client/vault', { cache: 'no-store' });
    return { data: await handleResponse<VaultEntry[]>(res) };
  } catch (error) {
    console.error('Failed to fetch vault entries:', error);
    return { data: [] };
  }
}

/**
 * Create new vault entry
 */
export async function createVaultEntry(entry: {
  service_name: string;
  username?: string;
  encrypted_password: string;
  notes?: string;
}): Promise<VaultEntry> {
  const res = await fetch('/api/client/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });

  return handleResponse<VaultEntry>(res);
}

/**
 * Update vault entry
 */
export async function updateVaultEntry(
  id: string,
  updates: Partial<VaultEntry>
): Promise<VaultEntry> {
  const res = await fetch('/api/client/vault', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });

  return handleResponse<VaultEntry>(res);
}

/**
 * Delete vault entry
 */
export async function deleteVaultEntry(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/client/vault', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  return handleResponse<{ success: boolean }>(res);
}

/**
 * Submit idea to AI for interpretation
 */
export async function interpretIdea(ideaText: string): Promise<{
  title: string;
  description: string;
  category: string;
  feasibility: string;
}> {
  const res = await fetch('/api/ai/interpret-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea: ideaText }),
    cache: 'no-store',
  });

  return handleResponse<{
    title: string;
    description: string;
    category: string;
    feasibility: string;
  }>(res);
}
