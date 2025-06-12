import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Generate notifications from recent audit trail if notifications table is empty
    if (!notifications || notifications.length === 0) {
      const generatedNotifications = await generateNotificationsFromAuditTrail(supabase, user.id);
      return NextResponse.json({ 
        notifications: generatedNotifications,
        hasNew: false 
      });
    }

    // Check for new notifications since last fetch (simplified)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const hasNew = notifications.some(n => n.created_at > fiveMinutesAgo && !n.read);

    return NextResponse.json({ 
      notifications: notifications || [],
      hasNew 
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate notifications from audit trail for demo purposes
async function generateNotificationsFromAuditTrail(supabase: any, userId: string) {
  try {
    // Fetch recent audit trail entries
    const { data: auditEntries, error } = await supabase
      .from('audit_trail')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !auditEntries) {
      return generateSampleNotifications(userId);
    }

    const notifications = auditEntries.map((entry: any, index: number) => ({
      id: `generated-${entry.id}`,
      type: mapEntityTypeToNotificationType(entry.entity_type),
      title: generateNotificationTitle(entry),
      message: generateNotificationMessage(entry),
      priority: generatePriority(entry),
      read: Math.random() > 0.7, // 30% read rate for demo
      actionRequired: entry.action === 'created' && ['deal', 'task'].includes(entry.entity_type),
      createdAt: entry.created_at,
      entityId: entry.entity_id,
      userId: userId,
      metadata: {
        action: entry.action,
        entityName: entry.metadata?.entity_name || `${entry.entity_type} ${entry.entity_id}`,
        oldValue: entry.metadata?.old_value,
        newValue: entry.metadata?.new_value,
        assignedTo: entry.metadata?.assigned_to,
        dueDate: entry.metadata?.due_date,
      }
    }));

    return notifications;
  } catch (error) {
    console.error('Error generating notifications from audit trail:', error);
    return generateSampleNotifications(userId);
  }
}

function mapEntityTypeToNotificationType(entityType: string): string {
  const mapping: { [key: string]: string } = {
    'deal': 'deal',
    'task': 'task',
    'client': 'client',
    'invoice': 'invoice',
    'user': 'system',
  };
  return mapping[entityType] || 'system';
}

function generateNotificationTitle(entry: any): string {
  const { action, entity_type, metadata } = entry;
  const entityName = metadata?.entity_name || `${entity_type} ${entry.entity_id}`;
  
  switch (action) {
    case 'created':
      return `New ${entity_type} created`;
    case 'updated':
      return `${entity_type} updated`;
    case 'deleted':
      return `${entity_type} deleted`;
    case 'status_changed':
      return `${entity_type} status changed`;
    case 'assigned':
      return `${entity_type} assigned to you`;
    case 'completed':
      return `${entity_type} completed`;
    default:
      return `${entity_type} ${action}`;
  }
}

function generateNotificationMessage(entry: any): string {
  const { action, entity_type, metadata } = entry;
  const entityName = metadata?.entity_name || `${entity_type} ${entry.entity_id}`;
  
  switch (action) {
    case 'created':
      return `A new ${entity_type} "${entityName}" has been created and requires your attention.`;
    case 'updated':
      return `${entity_type} "${entityName}" has been updated with new information.`;
    case 'deleted':
      return `${entity_type} "${entityName}" has been deleted from the system.`;
    case 'status_changed':
      return `${entity_type} "${entityName}" status changed from "${metadata?.old_value}" to "${metadata?.new_value}".`;
    case 'assigned':
      return `${entity_type} "${entityName}" has been assigned to you.`;
    case 'completed':
      return `${entity_type} "${entityName}" has been marked as completed.`;
    default:
      return `${entity_type} "${entityName}" has been ${action}.`;
  }
}

function generatePriority(entry: any): string {
  const { action, entity_type, metadata } = entry;
  
  // High priority for urgent actions
  if (action === 'assigned' || (action === 'created' && entity_type === 'task')) {
    return 'high';
  }
  
  // Urgent for overdue items
  if (metadata?.status === 'overdue' || action === 'overdue') {
    return 'urgent';
  }
  
  // Medium for updates and status changes
  if (action === 'updated' || action === 'status_changed') {
    return 'medium';
  }
  
  // Low for everything else
  return 'low';
}

// Fallback sample notifications for demo
function generateSampleNotifications(userId: string) {
  const now = new Date();
  const notifications = [
    {
      id: 'sample-1',
      type: 'deal',
      title: 'New deal created',
      message: 'A new deal "Enterprise Software License" has been created and requires your attention.',
      priority: 'high',
      read: false,
      actionRequired: true,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      entityId: 'deal-1',
      userId,
      metadata: {
        action: 'created',
        entityName: 'Enterprise Software License',
        assignedTo: 'John Doe',
      }
    },
    {
      id: 'sample-2',
      type: 'task',
      title: 'Task assigned to you',
      message: 'Task "Follow up with Acme Corp" has been assigned to you.',
      priority: 'medium',
      read: false,
      actionRequired: true,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      entityId: 'task-1',
      userId,
      metadata: {
        action: 'assigned',
        entityName: 'Follow up with Acme Corp',
        assignedTo: 'You',
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }
    },
    {
      id: 'sample-3',
      type: 'client',
      title: 'Client updated',
      message: 'Client "Acme Corporation" has been updated with new contact information.',
      priority: 'low',
      read: true,
      actionRequired: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      entityId: 'client-1',
      userId,
      metadata: {
        action: 'updated',
        entityName: 'Acme Corporation',
        oldValue: 'old@acme.com',
        newValue: 'new@acme.com',
      }
    },
    {
      id: 'sample-4',
      type: 'invoice',
      title: 'Invoice payment overdue',
      message: 'Invoice "INV-2024-001" is now 5 days overdue. Please follow up with the client.',
      priority: 'urgent',
      read: false,
      actionRequired: true,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      entityId: 'invoice-1',
      userId,
      metadata: {
        action: 'overdue',
        entityName: 'INV-2024-001',
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    },
    {
      id: 'sample-5',
      type: 'system',
      title: 'System maintenance scheduled',
      message: 'System maintenance is scheduled for tonight at 11 PM EST. Expected downtime: 30 minutes.',
      priority: 'medium',
      read: true,
      actionRequired: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      entityId: null,
      userId,
      metadata: {
        action: 'reminder',
        entityName: 'System Maintenance',
      }
    }
  ];

  return notifications;
}

// Handle individual notification actions (mark as read, delete)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const notificationId = searchParams.get('id');

    const cookieStore = cookies();
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'markAllRead') {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'markRead' && notificationId) {
      // Mark specific notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'updateSettings') {
      const body = await request.json();
      
      // Update notification settings (stored in user preferences or separate table)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: body,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Notification PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Notification DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
