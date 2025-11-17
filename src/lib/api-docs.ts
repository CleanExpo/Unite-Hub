/**
 * API Documentation Generator
 * Generates OpenAPI-style documentation for API endpoints
 */

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses?: Record<number, ApiResponse>;
  deprecated?: boolean;
  security?: string[];
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: {
    type: string;
    format?: string;
    enum?: string[];
    example?: any;
  };
}

export interface ApiRequestBody {
  description?: string;
  required?: boolean;
  content: {
    'application/json': {
      schema: any;
      example?: any;
    };
  };
}

export interface ApiResponse {
  description: string;
  content?: {
    'application/json': {
      schema: any;
      example?: any;
    };
  };
}

/**
 * API Documentation Registry
 */
class ApiDocRegistry {
  private endpoints: Map<string, ApiEndpoint> = new Map();

  /**
   * Register an API endpoint
   */
  register(endpoint: ApiEndpoint): void {
    const key = `${endpoint.method} ${endpoint.path}`;
    this.endpoints.set(key, endpoint);
  }

  /**
   * Get all registered endpoints
   */
  getAll(): ApiEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get endpoints by tag
   */
  getByTag(tag: string): ApiEndpoint[] {
    return this.getAll().filter((endpoint) =>
      endpoint.tags?.includes(tag)
    );
  }

  /**
   * Generate OpenAPI spec
   */
  toOpenAPI(): any {
    const paths: Record<string, any> = {};

    this.getAll().forEach((endpoint) => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses || {
          200: { description: 'Success' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
          500: { description: 'Internal Server Error' },
        },
        deprecated: endpoint.deprecated,
        security: endpoint.security,
      };
    });

    return {
      openapi: '3.0.0',
      info: {
        title: 'Unite-Hub API',
        version: '1.0.0',
        description: 'AI-powered CRM and marketing automation platform',
        contact: {
          name: 'API Support',
          url: 'https://unite-hub.com/support',
        },
      },
      servers: [
        {
          url: 'http://localhost:3008',
          description: 'Development',
        },
        {
          url: 'https://staging.unite-hub.com',
          description: 'Staging',
        },
        {
          url: 'https://unite-hub.com',
          description: 'Production',
        },
      ],
      paths,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }
}

export const apiDocs = new ApiDocRegistry();

// Example: Register health check endpoint
apiDocs.register({
  method: 'GET',
  path: '/api/health',
  summary: 'Health Check',
  description: 'Check system health including Redis and database status',
  tags: ['System'],
  responses: {
    200: {
      description: 'System is healthy',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              version: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  redis: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      latency: { type: 'number' },
                    },
                  },
                  database: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      latency: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
          example: {
            status: 'healthy',
            timestamp: '2025-01-17T12:00:00.000Z',
            uptime: 123456,
            environment: 'production',
            version: '1.0.0',
            checks: {
              redis: { status: 'healthy', latency: 5 },
              database: { status: 'healthy', latency: 12 },
            },
          },
        },
      },
    },
  },
});

// Example: Register metrics endpoint
apiDocs.register({
  method: 'GET',
  path: '/api/metrics',
  summary: 'Prometheus Metrics',
  description: 'Get Prometheus-compatible metrics for monitoring',
  tags: ['Monitoring'],
  responses: {
    200: {
      description: 'Metrics in Prometheus format',
      content: {
        'application/json': {
          schema: { type: 'string' },
          example: '# HELP http_requests_total Total HTTP requests\\n# TYPE http_requests_total counter\\nhttp_requests_total{method="GET",route="/api/health",status_code="200"} 42',
        },
      },
    },
  },
});
