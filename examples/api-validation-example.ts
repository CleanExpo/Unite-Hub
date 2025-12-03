/**
 * Example API Route with Comprehensive Zod Validation
 * SECURITY TASK P2-3: API Input Validation
 *
 * This file demonstrates best practices for API validation using
 * the Unite-Hub validation system.
 *
 * Location: /api/contacts/route.ts (example)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBody,
  validateQuery,
  validateWorkspaceId,
} from '@/lib/validation/middleware';
import {
  CreateContactSchema,
  UpdateContactSchema,
  ContactFilterSchema,
  BulkCreateContactsSchema,
} from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';

// ============================================
// GET /api/contacts - List contacts with filters
// ============================================

/**
 * List contacts with filtering, pagination, and sorting
 *
 * Query Parameters:
 * - workspace_id: string (UUID) - Required
 * - page: number - Default 1
 * - limit: number - Default 20, max 100
 * - status: ContactStatus - Optional
 * - tags: string (comma-separated) - Optional
 * - minScore: number (0-100) - Optional
 * - maxScore: number (0-100) - Optional
 * - search: string - Optional
 * - createdAfter: ISO datetime - Optional
 * - createdBefore: ISO datetime - Optional
 *
 * Example:
 * GET /api/contacts?workspace_id=550e8400-e29b-41d4-a716-446655440000&page=1&limit=20&status=qualified
 */
export async function GET(req: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQuery(req, ContactFilterSchema);

    if (!validation.success) {
      return validation.response; // 400 with validation errors
    }

    const {
      workspaceId,
      page,
      limit,
      status,
      tags,
      minScore,
      maxScore,
      search,
      createdAfter,
      createdBefore,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build database query
    const supabase = await createClient();
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId); // ✅ Workspace isolation enforced

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (minScore !== undefined) {
      query = query.gte('ai_score', minScore);
    }

    if (maxScore !== undefined) {
      query = query.lte('ai_score', maxScore);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (createdAfter) {
      query = query.gte('created_at', createdAfter);
    }

    if (createdBefore) {
      query = query.lte('created_at', createdBefore);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.contains('tags', tagArray);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false }); // Default sort
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contacts', details: error.message },
        { status: 500 }
      );
    }

    // Return response with pagination metadata
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/contacts - Create single contact
// ============================================

/**
 * Create a new contact
 *
 * Request Body:
 * {
 *   "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "company": "Acme Inc", // optional
 *   "phone": "+1-555-123-4567", // optional
 *   "status": "new", // optional, default: "new"
 *   "tags": ["lead", "demo-request"] // optional
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(req, CreateContactSchema);

    if (!validation.success) {
      return validation.response; // 400 with validation errors
    }

    const { workspaceId, name, email, company, phone, status, tags } = validation.data;

    // Check for duplicate email in workspace
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Contact with this email already exists in workspace',
          code: 'DUPLICATE_EMAIL',
        },
        { status: 409 }
      );
    }

    // Insert contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: workspaceId,
        name,
        email,
        company,
        phone,
        status: status || 'new',
        tags: tags || [],
        ai_score: 0, // Default score, will be updated by AI agent
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create contact', details: error.message },
        { status: 500 }
      );
    }

    // TODO: Trigger email agent to analyze contact
    // await triggerContactIntelligence(data.id, workspaceId);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/contacts - Bulk update contacts
// ============================================

/**
 * Bulk create contacts
 *
 * Request Body:
 * {
 *   "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "contacts": [
 *     { "name": "John Doe", "email": "john@example.com" },
 *     { "name": "Jane Smith", "email": "jane@example.com" }
 *   ]
 * }
 *
 * Max 1000 contacts per request
 */
export async function PATCH(req: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(req, BulkCreateContactsSchema);

    if (!validation.success) {
      return validation.response;
    }

    const { workspaceId, contacts } = validation.data;

    // Prepare contacts for insertion
    const timestamp = new Date().toISOString();
    const contactsToInsert = contacts.map(contact => ({
      workspace_id: workspaceId,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      status: contact.status || 'new',
      tags: contact.tags || [],
      ai_score: 0,
      created_at: timestamp,
      updated_at: timestamp,
    }));

    // Bulk insert
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactsToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create contacts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      created: data?.length || 0,
      data,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/contacts/[id] - Update single contact
// ============================================

/**
 * Update a contact
 *
 * Request Body (all fields optional):
 * {
 *   "name": "John Doe Updated",
 *   "email": "john.updated@example.com",
 *   "status": "qualified"
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate URL parameter
    const { id } = params; // In real implementation, use validateParams

    // Validate workspace_id
    const workspaceValidation = await validateWorkspaceId(req);

    if (!workspaceValidation.success) {
      return workspaceValidation.response;
    }

    const workspaceId = workspaceValidation.data;

    // Validate request body
    const bodyValidation = await validateBody(req, UpdateContactSchema);

    if (!bodyValidation.success) {
      return bodyValidation.response;
    }

    const updates = bodyValidation.data;

    // Update contact
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId) // ✅ Workspace isolation
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update contact', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Contact not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/contacts/[id] - Delete contact
// ============================================

/**
 * Delete a contact
 *
 * Query Parameter:
 * - workspace_id: string (UUID) - Required
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate URL parameter
    const { id } = params;

    // Validate workspace_id
    const workspaceValidation = await validateWorkspaceId(req);

    if (!workspaceValidation.success) {
      return workspaceValidation.response;
    }

    const workspaceId = workspaceValidation.data;

    // Delete contact
    const supabase = await createClient();
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId); // ✅ Workspace isolation

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete contact', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// VALIDATION ERROR EXAMPLES
// ============================================

/**
 * Example validation error responses:
 *
 * 1. Missing required field:
 * {
 *   "error": "Request body validation failed",
 *   "code": "VALIDATION_ERROR",
 *   "details": [
 *     {
 *       "field": "name",
 *       "message": "Name is required"
 *     }
 *   ],
 *   "timestamp": "2024-12-03T10:30:00.000Z"
 * }
 *
 * 2. Invalid email:
 * {
 *   "error": "Request body validation failed",
 *   "code": "VALIDATION_ERROR",
 *   "details": [
 *     {
 *       "field": "email",
 *       "message": "Must be a valid email address",
 *       "value": "invalid-email"
 *     }
 *   ],
 *   "timestamp": "2024-12-03T10:30:00.000Z"
 * }
 *
 * 3. Invalid workspace_id:
 * {
 *   "error": "Invalid workspace_id in query parameters",
 *   "code": "VALIDATION_ERROR",
 *   "details": [
 *     {
 *       "field": "workspace_id",
 *       "message": "Must be a valid UUID",
 *       "value": "not-a-uuid"
 *     }
 *   ],
 *   "timestamp": "2024-12-03T10:30:00.000Z"
 * }
 *
 * 4. Multiple validation errors:
 * {
 *   "error": "Request body validation failed",
 *   "code": "VALIDATION_ERROR",
 *   "details": [
 *     { "field": "name", "message": "Name is required" },
 *     { "field": "email", "message": "Must be a valid email address" },
 *     { "field": "workspace_id", "message": "workspace_id must be a valid UUID" }
 *   ],
 *   "timestamp": "2024-12-03T10:30:00.000Z"
 * }
 */
