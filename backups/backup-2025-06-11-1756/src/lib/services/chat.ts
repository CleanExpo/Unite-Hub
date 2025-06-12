// Chat service for Unite Group live chat system

import { createClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@supabase/ssr';
import type { 
  ChatConversation, 
  ChatMessage, 
  ChatOperator, 
  ChatTemplate,
  ChatRating,
  CreateConversationParams,
  SendMessageParams 
} from '@/types/chat';

// Server-side functions
export async function getConversations(userId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('chat_conversations')
    .select(`
      *,
      messages:chat_messages(count)
    `)
    .order('last_message_at', { ascending: false });
    
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  return data as ChatConversation[];
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data as ChatMessage[];
}

export async function getOnlineOperators() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_operators')
    .select('*')
    .in('status', ['online', 'away'])
    .order('rating', { ascending: false });
    
  if (error) {
    console.error('Error fetching operators:', error);
    return [];
  }
  
  return data as ChatOperator[];
}

// Client-side functions for real-time chat
export function createChatClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createConversation(
  supabase: any,
  params: CreateConversationParams
): Promise<ChatConversation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: user?.id,
      user_name: params.user_name || user?.email?.split('@')[0],
      user_email: params.user_email || user?.email,
      metadata: params.metadata
    })
    .select()
    .single();
    
  if (convError) {
    console.error('Error creating conversation:', convError);
    return null;
  }
  
  // Send initial message
  if (params.initial_message) {
    await sendMessage(supabase, {
      conversation_id: conversation.id,
      message: params.initial_message
    });
  }
  
  return conversation;
}

export async function sendMessage(
  supabase: any,
  params: SendMessageParams
): Promise<ChatMessage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: params.conversation_id,
      sender_id: user?.id,
      sender_type: user?.email?.includes('@unitegroup.co') ? 'operator' : 'user',
      sender_name: user?.email?.split('@')[0],
      message: params.message,
      attachments: params.attachments ? 
        params.attachments.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        })) : []
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error sending message:', error);
    return null;
  }
  
  return data;
}

export async function markMessagesAsRead(
  supabase: any,
  conversationId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user?.id);
}

export async function closeConversation(
  supabase: any,
  conversationId: string
): Promise<void> {
  await supabase
    .from('chat_conversations')
    .update({ status: 'closed' })
    .eq('id', conversationId);
}

export async function rateConversation(
  supabase: any,
  conversationId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  await supabase
    .from('chat_ratings')
    .insert({
      conversation_id: conversationId,
      rating,
      feedback
    });
}

// Operator functions
export async function getOperatorTemplates(operatorId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_templates')
    .select('*')
    .eq('operator_id', operatorId)
    .order('usage_count', { ascending: false });
    
  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
  
  return data as ChatTemplate[];
}

export async function updateOperatorStatus(
  supabase: any,
  operatorId: string,
  status: ChatOperator['status']
): Promise<void> {
  await supabase
    .from('chat_operators')
    .update({ 
      status,
      last_seen_at: new Date().toISOString()
    })
    .eq('id', operatorId);
}

export async function assignOperatorToConversation(
  supabase: any,
  conversationId: string,
  operatorId: string,
  operatorName: string
): Promise<void> {
  await supabase
    .from('chat_conversations')
    .update({ 
      operator_id: operatorId,
      operator_name: operatorName,
      status: 'active'
    })
    .eq('id', conversationId);
    
  // Send system message
  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'system',
      message: `${operatorName} has joined the conversation`
    });
}

// Real-time subscriptions
export function subscribeToConversation(
  supabase: any,
  conversationId: string,
  onMessage: (message: ChatMessage) => void
) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload: any) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();
}

export function subscribeToOperatorStatus(
  supabase: any,
  onStatusChange: (operator: ChatOperator) => void
) {
  return supabase
    .channel('operators:status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_operators'
      },
      (payload: any) => {
        onStatusChange(payload.new as ChatOperator);
      }
    )
    .subscribe();
}

// Typing indicators
export function broadcastTyping(
  supabase: any,
  conversationId: string,
  userId: string,
  userName: string,
  isTyping: boolean
) {
  return supabase.channel(`typing:${conversationId}`).send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, userName, isTyping }
  });
}

export function subscribeToTyping(
  supabase: any,
  conversationId: string,
  onTyping: (data: { userId: string; userName: string; isTyping: boolean }) => void
) {
  return supabase
    .channel(`typing:${conversationId}`)
    .on('broadcast', { event: 'typing' }, (payload: any) => {
      onTyping(payload.payload);
    })
    .subscribe();
}
