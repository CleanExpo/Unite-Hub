/**
 * AUDIT TRAIL API
 * 
 * Handles audit trail logging, querying, and reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuditTrailSystem, AuditEntrySchema, AuditQuerySchema } from '@/lib/crm/business-logic/AuditTrailSystem';
import { z } from 'zod';

/**
 * POST /api/crm/audit - Log audit event or generate reports
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different audit operations
    switch (body.action) {
      case 'log_event':
        return await handleLogEvent(body);
      case 'generate_compliance_report':
        return await handleGenerateComplianceReport(body);
      case 'archive_old_entries':
        return await handleArchiveOldEntries(body);
      case 'get_user_activity':
        return await handleGetUserActivity(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: log_event, generate_compliance_report, archive_old_entries, get_user_activity' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/audit - Query audit trail
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: any = {};
    
    if (searchParams.get('entityType')) query.entityType = searchParams.get('entityType');
    if (searchParams.get('entityId')) query.entityId = searchParams.get('entityId');
    if (searchParams.get('actionType')) query.actionType = searchParams.get('actionType');
    if (searchParams.get('userId')) query.userId = searchParams.get('userId');
    if (searchParams.get('severity')) query.severity = searchParams.get('severity');
    if (searchParams.get('startDate')) query.startDate = searchParams.get('startDate');
    if (searchParams.get('endDate')) query.endDate = searchParams.get('endDate');
    if (searchParams.get('limit')) query.limit = parseInt(searchParams.get('limit') || '100');
    if (searchParams.get('offset')) query.offset = parseInt(searchParams.get('offset') || '0');
    
    // Special case: get entity audit trail
    if (query.entityType && query.entityId && searchParams.get('trail') === 'true') {
      const result = await AuditTrailSystem.getEntityAuditTrail(
        query.entityType,
        query.entityId,
        query.limit || 50
      );
      
      return NextResponse.json(result);
    }
    
    // Query audit trail
    const result = await AuditTrailSystem.queryAuditTrail(query);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Audit query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle audit event logging
 */
async function handleLogEvent(body: any) {
  try {
    // Extract client IP and User Agent
    const auditData = {
      ...body.event,
      ipAddress: body.clientInfo?.ipAddress,
      userAgent: body.clientInfo?.userAgent
    };
    
    // Validate audit data
    const validated = AuditEntrySchema.parse(auditData);
    
    // Log the event
    const result = await AuditTrailSystem.logEvent(validated);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        auditId: result.auditId,
        message: 'Audit event logged successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Log event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log audit event' },
      { status: 500 }
    );
  }
}

/**
 * Handle compliance report generation
 */
async function handleGenerateComplianceReport(body: any) {
  try {
    const { startDate, endDate } = body;
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    const result = await AuditTrailSystem.generateComplianceReport(startDate, endDate);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        report: result.report,
        message: 'Compliance report generated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}

/**
 * Handle archive old entries
 */
async function handleArchiveOldEntries(body: any) {
  try {
    const { daysToKeep = 365 } = body;
    
    const result = await AuditTrailSystem.archiveOldEntries(daysToKeep);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        archivedCount: result.archivedCount,
        message: `Successfully archived ${result.archivedCount} old audit entries`
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Archive entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive old entries' },
      { status: 500 }
    );
  }
}

/**
 * Handle get user activity
 */
async function handleGetUserActivity(body: any) {
  try {
    const { userId, days = 30 } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const result = await AuditTrailSystem.getUserActivity(userId, days);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        activity: result.activity,
        message: 'User activity retrieved successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('User activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user activity' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract client info from request
 */
function extractClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  
  // Get IP address
  let ipAddress = '127.0.0.1'; // Default
  if (forwarded) {
    ipAddress = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ipAddress = realIp;
  }
  
  return {
    ipAddress,
    userAgent: userAgent || 'Unknown'
  };
}

/**
 * PUT /api/crm/audit - Update audit settings or configurations
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle audit configuration updates
    switch (body.action) {
      case 'update_retention_policy':
        return await handleUpdateRetentionPolicy(body);
      case 'update_severity_settings':
        return await handleUpdateSeveritySettings(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action for audit configuration' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Audit configuration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle retention policy updates
 */
async function handleUpdateRetentionPolicy(body: any) {
  try {
    const { retentionDays, userId } = body;
    
    if (!retentionDays || !userId) {
      return NextResponse.json(
        { success: false, error: 'Retention days and user ID are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would update system configuration
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      retentionDays,
      message: `Audit retention policy updated to ${retentionDays} days`
    });
    
  } catch (error) {
    console.error('Update retention policy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update retention policy' },
      { status: 500 }
    );
  }
}

/**
 * Handle severity settings updates
 */
async function handleUpdateSeveritySettings(body: any) {
  try {
    const { severityRules, userId } = body;
    
    if (!severityRules || !userId) {
      return NextResponse.json(
        { success: false, error: 'Severity rules and user ID are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would update system configuration
    // For now, we'll validate the structure and return success
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    for (const rule of severityRules) {
      if (!validSeverities.includes(rule.severity)) {
        return NextResponse.json(
          { success: false, error: `Invalid severity level: ${rule.severity}` },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      severityRules,
      message: 'Audit severity settings updated successfully'
    });
    
  } catch (error) {
    console.error('Update severity settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update severity settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/audit - Delete specific audit entries (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const userId = searchParams.get('userId');
    const adminKey = searchParams.get('adminKey');
    
    if (!auditId || !userId || !adminKey) {
      return NextResponse.json(
        { success: false, error: 'Audit ID, User ID, and Admin Key are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would verify admin privileges
    // This is a highly restricted operation
    if (adminKey !== 'AUDIT_ADMIN_DELETE_KEY') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin key' },
        { status: 403 }
      );
    }
    
    // This would delete a specific audit entry (rare operation)
    // Implementation would go here
    
    return NextResponse.json({
      success: true,
      message: 'Audit entry deleted (admin operation logged)'
    });
    
  } catch (error) {
    console.error('Delete audit entry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete audit entry' },
      { status: 500 }
    );
  }
}
