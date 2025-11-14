import { NextRequest } from 'next/server';
import { generateSectionCopy } from '@/lib/ai/claude-client';

export async function POST(req: NextRequest) {
  try {
    const { businessName, description, section = 'hero' } = await req.json();

    if (!businessName || !description) {
      return Response.json(
        { error: 'Business name and description are required' },
        { status: 400 }
      );
    }

    // Generate marketing copy using Claude
    const copy = await generateSectionCopy({
      businessName,
      businessDescription: description,
      pageType: 'landing',
      sectionName: section,
    });

    return Response.json({
      success: true,
      copy,
      model: 'claude-3-5-sonnet',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Marketing copy generation error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to generate marketing copy',
      },
      { status: 500 }
    );
  }
}
