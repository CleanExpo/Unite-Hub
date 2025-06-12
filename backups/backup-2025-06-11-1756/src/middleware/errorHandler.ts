import { NextRequest, NextResponse } from 'next/server';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class ValidationError extends Error implements APIError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements APIError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements APIError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements APIError {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error implements APIError {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error implements APIError {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  
  constructor(service: string, message?: string) {
    super(message || `External service ${service} unavailable`);
    this.name = 'ExternalServiceError';
  }
}

export function createErrorResponse(error: APIError | Error): NextResponse {
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error as APIError).details && { details: (error as APIError).details }
  });

  const statusCode = (error as APIError).statusCode || 500;
  const code = (error as APIError).code || 'INTERNAL_SERVER_ERROR';
  
  const response = {
    success: false,
    error: {
      code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: (error as APIError).details
      })
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status: statusCode });
}

export function withErrorHandler<T extends any[]>(handler: (...args: T) => Promise<NextResponse>) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error as APIError);
    }
  };
}

export function withAuth(handler: (req: NextRequest, context: { user: any }) => Promise<NextResponse>) {
  return withErrorHandler(async (req: NextRequest) => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AuthenticationError('Please log in to access this resource');
    }
    
    return handler(req, { user });
  });
}

export function requirePermission(permission: string) {
  return function(handler: (req: NextRequest, context: { user: any }) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, context) => {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: hasPermission, error } = await supabase
        .rpc('has_permission', { 
          user_id: context.user.id, 
          permission_name: permission 
        });

      if (error || !hasPermission) {
        throw new AuthorizationError(`Permission required: ${permission}`);
      }
      
      return handler(req, context);
    });
  };
}
