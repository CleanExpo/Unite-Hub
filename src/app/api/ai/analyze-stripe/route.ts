import { generateWithKatCoder } from '@/lib/openrouter';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { repoReadme, currentImplementation } = await req.json();

    const prompt = `
You are a senior full-stack developer analyzing Stripe integration requirements.

REPOSITORY README:
${repoReadme}

CURRENT IMPLEMENTATION:
${currentImplementation}

Analyze the README and identify:
1. Missing components compared to our current implementation
2. Required API routes that don't exist
3. Environment variables we need to add
4. Client components we need to create
5. Webhook events we're not handling
6. Database integration gaps
7. Testing requirements not met

Provide a detailed checklist of what needs to be implemented.
Format as JSON with structure:
{
  "missing_api_routes": ["route description"],
  "missing_components": ["component description"],
  "missing_env_vars": ["var description"],
  "missing_webhooks": ["webhook description"],
  "database_gaps": ["gap description"],
  "recommendations": ["recommendation"]
}
`;

    const analysis = await generateWithKatCoder(prompt);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze Stripe implementation' },
      { status: 500 }
    );
  }
}
