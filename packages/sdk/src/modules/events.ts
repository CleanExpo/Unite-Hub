import type {
  UniteHubConfig,
  ProjectEvent,
  CreateEventInput,
} from '../types';
import { UniteHubError } from '../types';

export class EventsModule {
  constructor(private config: UniteHubConfig) {}

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
    };
  }

  /** List events for a project */
  async list(projectId: string, params?: {
    event_type?: string;
    limit?: number;
  }): Promise<ProjectEvent[]> {
    const query = new URLSearchParams();
    query.set('project_id', projectId);
    if (params?.event_type) query.set('event_type', params.event_type);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(
      `${this.config.baseUrl}/project-connect/events?${query.toString()}`,
      { headers: this.headers }
    );
    if (!res.ok) {
      throw new UniteHubError('Failed to list events', res.status);
    }

    const data = await res.json();
    return data.events ?? data;
  }

  /** Send an event to Project Connect */
  async send(input: CreateEventInput): Promise<ProjectEvent> {
    const res = await fetch(`${this.config.baseUrl}/project-connect/events`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new UniteHubError('Failed to send event', res.status, await res.json().catch(() => null));
    }

    const data = await res.json();
    return data.event ?? data;
  }

  /** Send a batch of events */
  async sendBatch(events: CreateEventInput[]): Promise<ProjectEvent[]> {
    const results: ProjectEvent[] = [];
    for (const event of events) {
      results.push(await this.send(event));
    }
    return results;
  }
}
