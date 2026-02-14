import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/core/auth';
import { createWorkspaceScopedClient } from '@/core/database';
import { handleErrors, ValidationError, NotFoundError } from '@/core/errors';

/**
 * Zod schema for contact updates
 */
const updateContactSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  job_title: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['lead', 'prospect', 'customer', 'inactive']).optional(),
  ai_score: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

type UpdateContactInput = z.infer<typeof updateContactSchema>;

/**
 * Context type for route handlers with id parameter
 */
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/v1/contacts/:id
 *
 * Retrieve a single contact by ID from the authenticated user's workspace.
 *
 * @param {NextRequest} req - Next.js request object
 * @param {RouteContext} context - Route context with params
 * @returns {NextResponse} Contact data
 */
export const GET = withAuth(
  async (req: NextRequest, { user, workspace }, context: RouteContext) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid contact ID format', { id: ['Must be a valid UUID'] });
      }

      // Get workspace-scoped Supabase client
      const supabase = createWorkspaceScopedClient(workspace.id);

      // Fetch contact
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error || !contact) {
        throw new NotFoundError('Contact not found or not accessible in your workspace');
      }

      return NextResponse.json(
        { data: contact },
        {
          status: 200,
          headers: {
            'X-API-Version': '1.0.0',
            'Cache-Control': 'private, max-age=60, must-revalidate',
          },
        }
      );
    } catch (error) {
      return handleErrors(error);
    }
  }
);

/**
 * PUT /api/v1/contacts/:id
 *
 * Update a contact by ID in the authenticated user's workspace.
 *
 * Request Body:
 * {
 *   email?: string,
 *   first_name?: string,
 *   last_name?: string,
 *   company?: string,
 *   job_title?: string,
 *   phone?: string,
 *   status?: 'lead' | 'prospect' | 'customer' | 'inactive',
 *   ai_score?: number (0-100),
 *   tags?: string[],
 *   metadata?: Record<string, any>
 * }
 *
 * @param {NextRequest} req - Next.js request object
 * @param {RouteContext} context - Route context with params
 * @returns {NextResponse} Updated contact data
 */
export const PUT = withAuth(
  async (req: NextRequest, { user, workspace }, context: RouteContext) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid contact ID format', { id: ['Must be a valid UUID'] });
      }

      // Parse request body
      const body = await req.json();

      // Validate input
      const validationResult = updateContactSchema.safeParse(body);

      if (!validationResult.success) {
        throw new ValidationError(
          'Validation failed',
          validationResult.error.flatten().fieldErrors
        );
      }

      const updateData: UpdateContactInput = validationResult.data;

      // Get workspace-scoped Supabase client
      const supabase = createWorkspaceScopedClient(workspace.id);

      // Check if contact exists in workspace
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        throw new NotFoundError('Contact not found or not accessible in your workspace');
      }

      // If email is being updated, check for duplicates
      if (updateData.email && updateData.email !== existingContact.email) {
        const { data: duplicateContact } = await supabase
          .from('contacts')
          .select('id, email')
          .eq('email', updateData.email)
          .neq('id', id)
          .is('deleted_at', null)
          .single();

        if (duplicateContact) {
          throw new ValidationError('Validation failed', {
            email: [`Contact with email '${updateData.email}' already exists in this workspace`],
          });
        }
      }

      // Prepare update data with timestamp
      const contactUpdate = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Update contact
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(contactUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(
        { data: contact },
        {
          status: 200,
          headers: {
            'X-API-Version': '1.0.0',
          },
        }
      );
    } catch (error) {
      return handleErrors(error);
    }
  }
);

/**
 * DELETE /api/v1/contacts/:id
 *
 * Soft delete a contact by ID in the authenticated user's workspace.
 * Sets the deleted_at timestamp instead of permanently removing the record.
 *
 * @param {NextRequest} req - Next.js request object
 * @param {RouteContext} context - Route context with params
 * @returns {NextResponse} Success message
 */
export const DELETE = withAuth(
  async (req: NextRequest, { user, workspace }, context: RouteContext) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid contact ID format', { id: ['Must be a valid UUID'] });
      }

      // Get workspace-scoped Supabase client
      const supabase = createWorkspaceScopedClient(workspace.id);

      // Check if contact exists in workspace
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (!existingContact) {
        throw new NotFoundError('Contact not found or not accessible in your workspace');
      }

      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('contacts')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Contact deleted successfully',
        },
        {
          status: 200,
          headers: {
            'X-API-Version': '1.0.0',
          },
        }
      );
    } catch (error) {
      return handleErrors(error);
    }
  }
);
