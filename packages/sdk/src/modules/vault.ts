import type {
  UniteHubConfig,
  VaultCredential,
  VaultCredentialValue,
} from '../types';
import { UniteHubError } from '../types';

export class VaultModule {
  constructor(private config: UniteHubConfig) {}

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
    };
  }

  /** List available credentials (metadata only, no values) */
  async list(params?: {
    service_name?: string;
  }): Promise<VaultCredential[]> {
    const query = new URLSearchParams();
    if (params?.service_name) query.set('service_name', params.service_name);

    const qs = query.toString();
    const url = `${this.config.baseUrl}/vault/agent${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new UniteHubError('Failed to list vault credentials', res.status);
    }

    const data = await res.json();
    return data.credentials ?? data;
  }

  /** Get a decrypted credential value by ID */
  async get(id: string): Promise<VaultCredentialValue> {
    const res = await fetch(`${this.config.baseUrl}/vault/agent/${id}`, {
      headers: this.headers,
    });
    if (!res.ok) {
      throw new UniteHubError(`Vault credential ${id} not found`, res.status);
    }

    const data = await res.json();
    return data.credential ?? data;
  }

  /** Get a credential by service name (convenience) */
  async getByService(serviceName: string): Promise<VaultCredentialValue | null> {
    const credentials = await this.list({ service_name: serviceName });
    if (credentials.length === 0) return null;
    return this.get(credentials[0].id);
  }
}
