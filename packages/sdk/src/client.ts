import type { UniteHubConfig } from './types';
import { ContactsModule } from './modules/contacts';
import { EventsModule } from './modules/events';
import { VaultModule } from './modules/vault';

/**
 * Unite-Group SDK client.
 *
 * Provides typed access to the Unite-Group CRM API including
 * contacts management, project events, and vault credentials.
 *
 * @example
 * ```ts
 * const client = new UniteHubClient({
 *   baseUrl: 'https://unite-group.in/api',
 *   apiKey: 'your-api-key',
 * });
 *
 * const contacts = await client.contacts.list();
 * ```
 */
export class UniteHubClient {
  /** Contact management (CRUD) */
  public contacts: ContactsModule;

  /** Project Connect event ingestion */
  public events: EventsModule;

  /** Vault credential access (agent API) */
  public vault: VaultModule;

  constructor(private config: UniteHubConfig) {
    if (!config.baseUrl) throw new Error('baseUrl is required');
    if (!config.apiKey) throw new Error('apiKey is required');

    // Normalise base URL — strip trailing slash
    const baseUrl = config.baseUrl.replace(/\/+$/, '');
    const normalisedConfig = { ...config, baseUrl };

    this.contacts = new ContactsModule(normalisedConfig);
    this.events = new EventsModule(normalisedConfig);
    this.vault = new VaultModule(normalisedConfig);
  }
}
