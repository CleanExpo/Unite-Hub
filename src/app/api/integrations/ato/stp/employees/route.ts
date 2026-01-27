/**
 * STP Employees API
 *
 * GET /api/integrations/ato/stp/employees - List employees
 * POST /api/integrations/ato/stp/employees - Create employee
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEmployee,
  listActiveEmployees,
  type Employee,
} from '@/lib/integrations/ato/stpComplianceService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const employees = await listActiveEmployees(workspaceId);

    return NextResponse.json({
      success: true,
      employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('List employees error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list employees',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, ...employeeData } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate required fields
    const requiredFields = [
      'employee_id',
      'first_name',
      'last_name',
      'employment_type',
      'employment_start_date',
    ];
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return NextResponse.json({ error: `${field} required` }, { status: 400 });
      }
    }

    const employee = await createEmployee(workspaceId, employeeData);

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
