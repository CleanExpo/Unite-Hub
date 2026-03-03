import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const { id, executionId } = await params;

    const response = await fetch(`${BACKEND_URL}/api/workflows/${id}/executions/${executionId}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching execution detail:', error);
    return NextResponse.json({ error: 'Failed to fetch execution detail' }, { status: 500 });
  }
}
