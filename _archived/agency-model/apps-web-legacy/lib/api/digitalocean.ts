/**
 * DigitalOcean API Interface Service
 *
 * Wraps the dots-wrapper SDK to provide typed access to the
 * DigitalOcean API for deployment, droplet management, and
 * app platform operations.
 *
 * Uses the DIGITALOCEAN_API environment variable for authentication.
 */

import { createApiClient } from 'dots-wrapper';

// ---------------------------------------------------------------------------
// Client Singleton
// ---------------------------------------------------------------------------

let _client: ReturnType<typeof createApiClient> | null = null;

function getToken(): string {
  const token = process.env.DIGITALOCEAN_API || process.env.DO_API_TOKEN || '';

  if (!token || token === 'your-do-token-here') {
    throw new Error('DigitalOcean API token not configured. Set DIGITALOCEAN_API in .env');
  }

  return token;
}

/**
 * Returns a singleton DigitalOcean API client.
 * Lazily initialised on first call.
 */
export function getDoClient() {
  if (!_client) {
    _client = createApiClient({ token: getToken() });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// App Platform Helpers
// ---------------------------------------------------------------------------

export async function listApps() {
  const client = getDoClient();
  const { data } = await client.app.listApps({});
  return data;
}

export async function getApp(appId: string) {
  const client = getDoClient();
  const { data } = await client.app.getApp({ app_id: appId });
  return data;
}

export async function createAppDeployment(appId: string) {
  const client = getDoClient();
  const { data } = await client.app.createAppDeployment({
    app_id: appId,
  });
  return data;
}

export async function deleteApp(appId: string) {
  const client = getDoClient();
  await client.app.deleteApp({ app_id: appId });
}

// ---------------------------------------------------------------------------
// Droplet Helpers
// ---------------------------------------------------------------------------

export async function listDroplets() {
  const client = getDoClient();
  const { data } = await client.droplet.listDroplets({});
  return data;
}

export async function getDroplet(dropletId: number) {
  const client = getDoClient();
  const { data } = await client.droplet.getDroplet({
    droplet_id: dropletId,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Domain Helpers
// ---------------------------------------------------------------------------

export async function listDomains() {
  const client = getDoClient();
  const { data } = await client.domain.listDomains({});
  return data;
}

// ---------------------------------------------------------------------------
// Database Helpers
// ---------------------------------------------------------------------------

export async function listDatabases() {
  const client = getDoClient();
  const { data } = await client.database.listDatabaseClusters({});
  return data;
}

// ---------------------------------------------------------------------------
// Account / Actions
// ---------------------------------------------------------------------------

export async function getAccount() {
  const client = getDoClient();
  const { data } = await client.account.getAccount();
  return data;
}

export async function listActions() {
  const client = getDoClient();
  const { data } = await client.action.listActions({});
  return data;
}

// ---------------------------------------------------------------------------
// Re-export for direct SDK access
// ---------------------------------------------------------------------------

export { createApiClient } from 'dots-wrapper';
