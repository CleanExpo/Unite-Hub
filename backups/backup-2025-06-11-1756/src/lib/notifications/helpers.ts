// Helper function to create notifications programmatically (for use by other parts of the system)
export async function createNotification(
  supabase: any,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    priority?: string;
    actionRequired?: boolean;
    entityId?: string;
    metadata?: any;
  }
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || 'medium',
        action_required: notification.actionRequired || false,
        entity_id: notification.entityId,
        metadata: notification.metadata || {},
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
}

// Helper function to send real-time notifications (WebSocket/Server-Sent Events could be implemented here)
export function sendRealtimeNotification(userId: string, notification: any) {
  // This would integrate with WebSocket or Server-Sent Events
  // For now, we rely on polling from the frontend
  console.log(`Sending real-time notification to user ${userId}:`, notification);
}
