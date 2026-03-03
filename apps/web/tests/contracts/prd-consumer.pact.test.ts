/**
 * Pact Consumer Tests - PRD API Contract
 *
 * These tests define the contract between the Next.js frontend (consumer)
 * and the FastAPI backend (provider). They ensure that the frontend's
 * expectations of the API are documented and validated.
 *
 * Installation:
 * - pnpm add -D @pact-foundation/pact (already installed)
 *
 * Run tests:
 * - pnpm test:contracts
 *
 * Pact Files Generated:
 * - pacts/web-backend-api.json (contract specification)
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import path from 'path'

const { like, eachLike, string, integer, iso8601DateTimeWithMillis } = MatchersV3

// Pact Provider Configuration
const provider = new PactV3({
  consumer: 'web',
  provider: 'backend-api',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
})

describe('PRD Generation API Contract', () => {
  describe('POST /api/prd/generate', () => {
    it('should generate a PRD with valid input', async () => {
      await provider
        .given('the PRD generation service is available')
        .uponReceiving('a request to generate a PRD')
        .withRequest({
          method: 'POST',
          path: '/api/prd/generate',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            product_name: 'Test Product',
            description: 'A test product for contract testing',
            target_audience: 'Developers',
            key_features: ['Feature 1', 'Feature 2'],
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            run_id: string('run_123'),
            status: string('pending'),
            message: string('PRD generation started'),
            created_at: iso8601DateTimeWithMillis(),
          },
        })
        .executeTest(async (mockServer) => {
          // Make actual HTTP request to mock server
          const response = await fetch(`${mockServer.url}/api/prd/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_name: 'Test Product',
              description: 'A test product for contract testing',
              target_audience: 'Developers',
              key_features: ['Feature 1', 'Feature 2'],
            }),
          })

          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.run_id).toBeDefined()
          expect(data.status).toBe('pending')
          expect(data.message).toBeDefined()
          expect(data.created_at).toBeDefined()
        })
    })

    it('should return validation error for invalid input', async () => {
      await provider
        .given('the PRD generation service is available')
        .uponReceiving('a request with missing required fields')
        .withRequest({
          method: 'POST',
          path: '/api/prd/generate',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            product_name: '',
            description: '',
          },
        })
        .willRespondWith({
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            detail: eachLike({
              loc: eachLike(string()),
              msg: string(),
              type: string(),
            }),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/prd/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_name: '',
              description: '',
            }),
          })

          const data = await response.json()

          expect(response.status).toBe(422)
          expect(data.detail).toBeDefined()
          expect(Array.isArray(data.detail)).toBe(true)
        })
    })
  })

  describe('GET /api/prd/status/{run_id}', () => {
    it('should return status for a valid run_id', async () => {
      await provider
        .given('a PRD generation is in progress')
        .uponReceiving('a request to check status')
        .withRequest({
          method: 'GET',
          path: '/api/prd/status/run_123',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            run_id: string('run_123'),
            status: string('in_progress'),
            progress: integer(50),
            current_step: string('Analyzing requirements'),
            steps_completed: integer(2),
            steps_total: integer(4),
            created_at: iso8601DateTimeWithMillis(),
            updated_at: iso8601DateTimeWithMillis(),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/prd/status/run_123`)
          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.run_id).toBe('run_123')
          expect(data.status).toBeDefined()
          expect(data.progress).toBeGreaterThanOrEqual(0)
          expect(data.progress).toBeLessThanOrEqual(100)
        })
    })

    it('should return 404 for non-existent run_id', async () => {
      await provider
        .given('no PRD generation exists for the run_id')
        .uponReceiving('a request for non-existent run')
        .withRequest({
          method: 'GET',
          path: '/api/prd/status/invalid_run',
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            detail: string('Run not found'),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/prd/status/invalid_run`)
          const data = await response.json()

          expect(response.status).toBe(404)
          expect(data.detail).toBeDefined()
        })
    })
  })

  describe('GET /api/prd/result/{prd_id}', () => {
    it('should return completed PRD result', async () => {
      await provider
        .given('a PRD has been successfully generated')
        .uponReceiving('a request to fetch the PRD result')
        .withRequest({
          method: 'GET',
          path: '/api/prd/result/prd_123',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            prd_id: string('prd_123'),
            run_id: string('run_123'),
            title: string('Product Requirements Document'),
            content: like({
              product_name: 'Test Product',
              executive_summary: 'Executive summary...',
              features: eachLike({
                name: string(),
                description: string(),
                priority: string(),
              }),
              requirements: like({
                functional: eachLike(string()),
                non_functional: eachLike(string()),
              }),
            }),
            status: string('completed'),
            created_at: iso8601DateTimeWithMillis(),
            completed_at: iso8601DateTimeWithMillis(),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/prd/result/prd_123`)
          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.prd_id).toBe('prd_123')
          expect(data.content).toBeDefined()
          expect(data.content.product_name).toBeDefined()
          expect(data.status).toBe('completed')
        })
    })
  })

  describe('GET /api/prd/documents/{prd_id}', () => {
    it('should return list of generated documents', async () => {
      await provider
        .given('documents have been generated for the PRD')
        .uponReceiving('a request to list documents')
        .withRequest({
          method: 'GET',
          path: '/api/prd/documents/prd_123',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            prd_id: string('prd_123'),
            documents: eachLike({
              id: string(),
              filename: string(),
              type: string(),
              size: integer(),
              created_at: iso8601DateTimeWithMillis(),
              download_url: string(),
            }),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/prd/documents/prd_123`)
          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.prd_id).toBe('prd_123')
          expect(Array.isArray(data.documents)).toBe(true)
        })
    })
  })
})

describe('Health Check Contract', () => {
  it('should return health status', async () => {
    await provider
      .given('the API is running')
      .uponReceiving('a health check request')
      .withRequest({
        method: 'GET',
        path: '/health',
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          status: string('healthy'),
          timestamp: iso8601DateTimeWithMillis(),
          version: string(),
        },
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/health`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('healthy')
        expect(data.timestamp).toBeDefined()
      })
  })
})
