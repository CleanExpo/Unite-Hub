import type {
  UniteHubConfig,
  Contact,
  CreateContactInput,
  UpdateContactInput,
} from '../types';
import { UniteHubError } from '../types';

export class ContactsModule {
  constructor(private config: UniteHubConfig) {}

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
    };
  }

  /** List all contacts */
  async list(params?: {
    status?: Contact['status'];
    limit?: number;
    offset?: number;
  }): Promise<Contact[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const url = `${this.config.baseUrl}/contacts${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new UniteHubError('Failed to list contacts', res.status, await res.json().catch(() => null));
    }

    const data = await res.json();
    return data.contacts ?? data;
  }

  /** Get a single contact by ID */
  async get(id: string): Promise<Contact> {
    const res = await fetch(`${this.config.baseUrl}/contacts/${id}`, {
      headers: this.headers,
    });
    if (!res.ok) {
      throw new UniteHubError(`Contact ${id} not found`, res.status);
    }

    const data = await res.json();
    return data.contact ?? data;
  }

  /** Create a new contact */
  async create(input: CreateContactInput): Promise<Contact> {
    const res = await fetch(`${this.config.baseUrl}/contacts`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new UniteHubError('Failed to create contact', res.status, await res.json().catch(() => null));
    }

    const data = await res.json();
    return data.contact ?? data;
  }

  /** Update an existing contact */
  async update(id: string, input: UpdateContactInput): Promise<Contact> {
    const res = await fetch(`${this.config.baseUrl}/contacts/${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new UniteHubError(`Failed to update contact ${id}`, res.status);
    }

    const data = await res.json();
    return data.contact ?? data;
  }

  /** Delete a contact */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.config.baseUrl}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) {
      throw new UniteHubError(`Failed to delete contact ${id}`, res.status);
    }
  }
}
