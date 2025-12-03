/**
 * Contact Validation API Route
 * POST /api/verify/contact
 *
 * Validates contact information (email, phone, ABN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateContact, quickValidateContact } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, options, quick } = body;

    if (!contact || !contact.email || !contact.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: contact.email, contact.phone' },
        { status: 400 }
      );
    }

    // Quick validation (format only)
    if (quick) {
      const result = quickValidateContact(contact);
      return NextResponse.json(result);
    }

    // Full validation with domain/ABN lookup
    const result = await validateContact(contact, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Contact validation error:', error);
    return NextResponse.json(
      { error: 'Contact validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
