// Chat system types for Unite Group

export interface ChatOperator {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  department?: string;
  languages: string[];
  specialties: string[];
  rating: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface ChatConversation {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  status: 'active' | 'closed' | 'pending';
  operator_id?: string;
  operator_name?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  metadata?: Record<string, any>;
  messages?: ChatMessage[];
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_type: 'user' | 'operator' | 'system';
  sender_name?: string;
  message: string;
  attachments?: ChatAttachment[];
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ChatTemplate {
  id: string;
  operator_id: string;
  title: string;
  message: string;
  category?: string;
  shortcuts: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatRating {
  id: string;
  conversation_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  created_at: string;
}

export interface ChatWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  conversation?: ChatConversation;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  typingUser?: string;
  error?: string;
  unreadCount: number;
}

export interface SendMessageParams {
  conversation_id: string;
  message: string;
  attachments?: File[];
}

export interface CreateConversationParams {
  user_name?: string;
  user_email?: string;
  initial_message: string;
  metadata?: Record<string, any>;
}

export interface ChatNotification {
  id: string;
  type: 'message' | 'operator_joined' | 'operator_left' | 'conversation_closed';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface ChatPreferences {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left';
}
