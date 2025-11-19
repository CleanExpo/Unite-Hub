/**
 * Client API Routes Tests - Phase 2
 */

import { describe, it, expect } from 'vitest';

describe('Client API Routes', () => {
  describe('POST /api/client/ideas', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3008/api/client/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Build a mobile app',
          type: 'text',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/client/proposals', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3008/api/client/proposals');

      expect(response.status).toBe(401);
    });
  });

  // Add more tests as needed
});
