/**
 * Pact Contract Tests: Contacts API
 *
 * These tests define the contract between the Synthex frontend (consumer)
 * and the Unite-Hub API (provider) for contacts endpoints.
 */

import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { describe, it, expect } from 'vitest';

const { like, eachLike, uuid, iso8601DateTime, email } = MatchersV3;

const provider = new PactV4({
  consumer: 'synthex-frontend',
  provider: 'unite-hub-api',
  logLevel: 'warn',
  dir: path.resolve(__dirname, 'pacts'),
});

describe('Contacts API Contract', () => {
  describe('GET /api/contacts', () => {
    it('returns paginated contacts list for a workspace', async () => {
      await provider
        .addInteraction()
        .given('contacts exist for workspace')
        .uponReceiving('a request for contacts list')
        .withRequest('GET', '/api/contacts', (builder) => {
          builder.query({
            workspaceId: 'test-workspace-id',
            page: '1',
            pageSize: '20',
          });
          builder.headers({ Authorization: 'Bearer valid-token' });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              contacts: eachLike({
                id: uuid(),
                name: like('John Doe'),
                email: email(),
                company: like('Acme Inc'),
                status: like('active'),
                ai_score: like(85),
                workspace_id: like('test-workspace-id'),
                created_at: iso8601DateTime(),
                updated_at: iso8601DateTime(),
              }),
            },
            meta: {
              page: like(1),
              pageSize: like(20),
              totalCount: like(100),
              totalPages: like(5),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/contacts?workspaceId=test-workspace-id&page=1&pageSize=20`,
            {
              headers: { Authorization: 'Bearer valid-token' },
            }
          );

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(Array.isArray(body.data?.contacts)).toBe(true);
        });
    });
  });

  describe('POST /api/contacts', () => {
    it('creates a new contact in workspace', async () => {
      await provider
        .addInteraction()
        .given('workspace exists and user authenticated')
        .uponReceiving('a request to create a contact')
        .withRequest('POST', '/api/contacts', (builder) => {
          builder.headers({
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          });
          builder.jsonBody({
            workspaceId: like('test-workspace-id'),
            name: like('Jane Smith'),
            email: email('jane@example.com'),
            company: like('Tech Corp'),
            status: like('new'),
          });
        })
        .willRespondWith(201, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              contact: {
                id: uuid(),
                name: like('Jane Smith'),
                email: like('jane@example.com'),
                company: like('Tech Corp'),
                status: like('new'),
                ai_score: like(0),
                workspace_id: like('test-workspace-id'),
                created_at: iso8601DateTime(),
                updated_at: iso8601DateTime(),
              },
            },
            message: like('Contact created successfully'),
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/contacts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer valid-token',
            },
            body: JSON.stringify({
              workspaceId: 'test-workspace-id',
              name: 'Jane Smith',
              email: 'jane@example.com',
              company: 'Tech Corp',
              status: 'new',
            }),
          });

          expect(response.status).toBe(201);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data?.contact?.id).toBeDefined();
        });
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('returns a single contact by ID', async () => {
      const contactId = '123e4567-e89b-12d3-a456-426614174000';

      await provider
        .addInteraction()
        .given('contact exists with ID')
        .uponReceiving('a request for a specific contact')
        .withRequest('GET', `/api/contacts/${contactId}`, (builder) => {
          builder.query({ workspaceId: 'test-workspace-id' });
          builder.headers({ Authorization: 'Bearer valid-token' });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              contact: {
                id: like(contactId),
                name: like('John Doe'),
                email: email(),
                company: like('Acme Inc'),
                status: like('active'),
                ai_score: like(85),
                workspace_id: like('test-workspace-id'),
                created_at: iso8601DateTime(),
                updated_at: iso8601DateTime(),
              },
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/contacts/${contactId}?workspaceId=test-workspace-id`,
            {
              headers: { Authorization: 'Bearer valid-token' },
            }
          );

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data?.contact?.id).toBeDefined();
        });
    });
  });
});
