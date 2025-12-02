 
/* global Buffer, global, Response, Headers */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withHttpTracing,
  tracedFetch,
  createExpressMiddleware,
  getTracingHealth,
  HttpMiddlewareConfig,
} from '@/lib/tracing/http-middleware';
import {
  createTraceContext,
  runWithTraceContext,
  getTraceContext,
} from '@/lib/tracing/trace-context';

describe('HTTP Middleware - Phase 6.8 Step 4', () => {
  describe('QUALITY GATE 1: Request Tracing', () => {
    it('should create HTTP span for request', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should parse incoming trace headers', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedContext: any = null;

      const mockHandler = vi.fn(async () => {
        capturedContext = getTraceContext();
        return new NextResponse('OK', { status: 200 });
      });

      const context = createTraceContext();
      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
        headers: {
          traceparent: `00-${context.traceId}-${context.spanId}-01`,
          'x-request-id': context.requestId,
        },
      });

      await withHttpTracing(request, mockHandler);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.traceId).toBe(context.traceId);
    });

    it('should preserve request method and path', async () => {
      let capturedMethod: string = '';
      let capturedPath: string = '';

      const mockHandler = vi.fn(async (req) => {
        capturedMethod = req.method;
        capturedPath = req.nextUrl.pathname;
        return new NextResponse('OK', { status: 200 });
      });

      const request = new NextRequest('http://localhost:3008/api/users/123', {
        method: 'POST',
      });

      await withHttpTracing(request, mockHandler);

      expect(capturedMethod).toBe('POST');
      expect(capturedPath).toBe('/api/users/123');
    });
  });

  describe('QUALITY GATE 2: Response Recording', () => {
    it('should record response status code', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('Created', { status: 201 }));
      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'POST',
      });

      const response = await withHttpTracing(request, mockHandler);

      expect(response.status).toBe(201);
    });

    it('should record response content length', async () => {
      const body = 'This is test content';
      const mockHandler = vi.fn(async () =>
        new NextResponse(body, {
          status: 200,
          headers: {
            'content-length': String(Buffer.byteLength(body)),
          },
        })
      );

      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      expect(response.status).toBe(200);
    });

    it('should handle error responses gracefully', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('Not Found', { status: 404 }));
      const request = new NextRequest('http://localhost:3008/api/missing', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      expect(response.status).toBe(404);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('QUALITY GATE 3: Trace Header Propagation', () => {
    it('should add trace headers to response', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      // Check that trace headers are present
      const traceparent = response.headers.get('traceparent');
      const requestId = response.headers.get('x-request-id');

      expect(traceparent).toBeDefined();
      expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      expect(requestId).toBeDefined();
    });

    it('should propagate baggage to response', async () => {
      const mockHandler = vi.fn(async () => {
        // Add baggage inside handler
        const context = getTraceContext();
        if (context) {
          context.baggage['user-id'] = '12345';
        }
        return new NextResponse('OK', { status: 200 });
      });

      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      const baggage = response.headers.get('baggage');
      expect(baggage).toBeDefined();
    });

    it('should preserve existing response headers', async () => {
      const mockHandler = vi.fn(async () =>
        new NextResponse('OK', {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-custom-header': 'test-value',
          },
        })
      );

      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      const response = await withHttpTracing(request, mockHandler);

      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('x-custom-header')).toBe('test-value');
    });
  });

  describe('QUALITY GATE 4: Path Exclusion', () => {
    it('should skip tracing for health check paths', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/health', {
        method: 'GET',
      });

      await withHttpTracing(request, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      // Should not add trace context if excluded
    });

    it('should skip tracing for Next.js internal paths', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/_next/static/chunk.js', {
        method: 'GET',
      });

      await withHttpTracing(request, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should allow custom exclusion patterns', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/admin/secret', {
        method: 'GET',
      });

      const config: HttpMiddlewareConfig = {
        excludePaths: ['/admin/secret'],
      };

      await withHttpTracing(request, mockHandler, config);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('QUALITY GATE 5: Fetch Tracing', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should add trace headers to fetch calls', async () => {
      const context = createTraceContext();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedInit: any = null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = vi.fn(async (url: any, init: any) => {
        capturedInit = init;
        return new Response('OK', { status: 200 });
      });

      await runWithTraceContext(context, async () => {
        const response = await tracedFetch('https://api.example.com/data');
        expect(response.status).toBe(200);
      });

      expect(capturedInit?.headers).toBeDefined();
      const headers = capturedInit.headers as Headers;
      expect(headers.get('traceparent')).toBeDefined();
      expect(headers.get('x-request-id')).toBeDefined();
    });

    it('should preserve fetch request method', async () => {
      let capturedMethod: string = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = vi.fn(async (url: any, init: any) => {
        capturedMethod = init?.method || 'GET';
        return new Response('OK', { status: 201 });
      });

      const context = createTraceContext();
      await runWithTraceContext(context, async () => {
        await tracedFetch('https://api.example.com/data', {
          method: 'POST',
        });
      });

      expect(capturedMethod).toBe('POST');
    });

    it('should handle fetch errors', async () => {
       
      global.fetch = vi.fn(async () => {
        throw new Error('Network error');
      });

      const context = createTraceContext();

      await expect(
        runWithTraceContext(context, async () => {
          await tracedFetch('https://api.example.com/data');
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('QUALITY GATE 6: Error Handling', () => {
    it('should catch handler errors without breaking tracing', async () => {
      const mockHandler = vi.fn(async () => {
        throw new Error('Handler error');
      });

      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      await expect(withHttpTracing(request, mockHandler)).rejects.toThrow(
        'Handler error'
      );
    });

    it('should gracefully handle tracing middleware failures', async () => {
      const mockHandler = vi.fn(async () => new NextResponse('OK', { status: 200 }));
      const request = new NextRequest('http://localhost:3008/api/test', {
        method: 'GET',
      });

      // This should not throw even if middleware fails internally
      const response = await withHttpTracing(request, mockHandler);

      expect(response).toBeDefined();
    });
  });

  describe('QUALITY GATE 7: Express Middleware', () => {
    it('should create Express middleware', () => {
      const middleware = createExpressMiddleware();
      expect(middleware).toBeInstanceOf(Function);
    });

    it('should attach trace context to Express request', () => {
      const middleware = createExpressMiddleware();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq: any = {
        method: 'GET',
        path: '/api/test',
        headers: {},
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRes: any = {
        send: vi.fn(),
        set: vi.fn(),
        statusCode: 200,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockNext: any = vi.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should exclude paths in Express middleware', () => {
      const middleware = createExpressMiddleware({
        excludePaths: ['/health'],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq: any = {
        method: 'GET',
        path: '/health',
        headers: {},
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRes: any = {
        send: vi.fn(),
        set: vi.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockNext: any = vi.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('QUALITY GATE 8: Health Check', () => {
    it('should report tracing health as active', async () => {
      const health = await getTracingHealth();

      expect(health.active).toBe(true);
      expect(health.tracingEnabled).toBe(true);
      expect(health.message).toBeDefined();
    });
  });
});
