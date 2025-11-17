import { NextResponse } from 'next/server';
import { apiDocs } from '@/lib/api-docs';

/**
 * API Documentation Endpoint
 * Returns OpenAPI 3.0 specification
 */
export async function GET() {
  const openApiSpec = apiDocs.toOpenAPI();

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
