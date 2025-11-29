import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/core/auth';
import { createWorkspaceScopedClient } from '@/core/database';
import { handleErrors, ValidationError } from '@/core/errors';

/**
 * Zod schema for contact creation
 */
const createContactSchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  job_title: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['lead', 'prospect', 'customer', 'inactive']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

type CreateContactInput = z.infer<typeof createContactSchema>;

/**
 * GET /api/v1/contacts
 *
 * List all contacts in the authenticated user's workspace with pagination.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Filter by status (lead, prospect, customer, inactive)
 * - search: Search by name or email
 *
 * @returns {NextResponse} Paginated list of contacts
 */
export const GET = withAuth(async (req: NextRequest, { user, workspace }) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get workspace-scoped Supabase client
    const supabase = createWorkspaceScopedClient(workspace.id);

    // Build query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .is('deleted_at', null) // Exclude soft-deleted contacts
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && ['lead', 'prospect', 'customer', 'inactive'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: contacts, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json(
      {
        data: contacts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
      {
        status: 200,
        headers: {
          'X-API-Version': '1.0.0',
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error) {
    return handleErrors(error);
  }
});

/**
 * POST /api/v1/contacts
 *
 * Create a new contact in the authenticated user's workspace.
 *
 * Request Body:
 * {
 *   email: string (required),
 *   first_name?: string,
 *   last_name?: string,
 *   company?: string,
 *   job_title?: string,
 *   phone?: string,
 *   status?: 'lead' | 'prospect' | 'customer' | 'inactive',
 *   tags?: string[],
 *   metadata?: Record<string, any>
 * }
 *
 * @returns {NextResponse} Created contact
 */
export const POST = withAuth(async (req: NextRequest, { user, workspace }) => {
  try {
    // Parse request body
    const body = await req.json();

    // Validate input
    const validationResult = createContactSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Validation failed',
        validationResult.error.flatten().fieldErrors
      );
    }

    const contactData: CreateContactInput = validationResult.data;

    // Get workspace-scoped Supabase client
    const supabase = createWorkspaceScopedClient(workspace.id);

    // Check for duplicate email in workspace
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('email', contactData.email)
      .is('deleted_at', null)
      .single();

    if (existingContact) {
      throw new ValidationError('Validation failed', {
        email: [`Contact with email '${contactData.email}' already exists in this workspace`],
      });
    }

    // Prepare contact data with workspace_id
    const newContact = {
      ...contactData,
      workspace_id: workspace.id,
      status: contactData.status || 'lead',
      ai_score: 0, // Initial score
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([newContact])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data: contact },
      {
        status: 201,
        headers: {
          'X-API-Version': '1.0.0',
          'Location': `/api/v1/contacts/${contact.id}`,
        },
      }
    );
  } catch (error) {
    return handleErrors(error);
  }
});
