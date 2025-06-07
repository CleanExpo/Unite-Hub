'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Paperclip,
  Smile,
  Star,
  Check,
  CheckCheck
} from 'lucide-react';
import Image from 'next/image';
import { 
  createChatClient,
  createConversation,
  sendMessage,
  markMessagesAsRead,
  closeConversation,
  rateConversation,
  subscribeToConversation,
  subscribeToTyping,
  broadcastTyping
} from '@/lib/services/chat';
import type { 
  ChatMessage, 
  ChatConversation,
  ChatWidgetState,
  ChatPreferences 
} from '@/types/chat';

export default function ChatWidget() {
  const [state, setState] = useState<ChatWidgetState>({
    isOpen: false,
    isMinimized: false,
    conversation: undefined,
    messages: [],
    isLoading: false,
    isTyping: false,
    typingUser: undefined,
    error: undefined,
    unreadCount: 0
  });

  const [preferences, setPreferences] = useState<ChatPreferences>({
    soundEnabled: true,
    desktopNotifications: false,
    emailNotifications: true,
    theme: 'auto',
    position: 'bottom-right'
  });

  const [messageInput, setMessageInput] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useRef(createChatClient());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const conversationSubscription = useRef<any>();
  const typingSubscription = useRef<any>();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (state.conversation?.id) {
      // Subscribe to new messages
      conversationSubscription.current = subscribeToConversation(
        supabase.current,
        state.conversation.id,
        (message: ChatMessage) => {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, message],
            unreadCount: prev.isOpen ? 0 : prev.unreadCount + 1
          }));
          
          // Play notification sound
          if (preferences.soundEnabled && message.sender_type !== 'user') {
            playNotificationSound();
          }
        }
      );

      // Subscribe to typing indicators
      typingSubscription.current = subscribeToTyping(
        supabase.current,
        state.conversation.id,
        ({ userId, userName, isTyping }) => {
          setState(prev => ({
            ...prev,
            isTyping: isTyping,
            typingUser: isTyping ? userName : undefined
          }));
        }
      );

      // Mark messages as read when opening chat
      if (state.isOpen) {
        markMessagesAsRead(supabase.current, state.conversation.id);
      }
    }

    return () => {
      conversationSubscription.current?.unsubscribe();
      typingSubscription.current?.unsubscribe();
    };
  }, [state.conversation?.id, state.isOpen, preferences.soundEnabled]);

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {
      // Ignore errors if audio play fails
    });
  };

  const handleOpen = async () => {
    setState(prev => ({ ...prev, isOpen: true, unreadCount: 0 }));
    
    // Create conversation if none exists
    if (!state.conversation) {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const conversation = await createConversation(supabase.current, {
        initial_message: ''
      });
      
      if (conversation) {
        setState(prev => ({
          ...prev,
          conversation,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to start conversation',
          isLoading: false
        }));
      }
    }
  };

  const handleClose = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !state.conversation) return;

    const message = messageInput.trim();
    setMessageInput('');
    
    // Optimistically add message
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: state.conversation.id,
      sender_type: 'user',
      sender_name: 'You',
      message,
      attachments: [],
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage]
    }));

    // Send the actual message
    const sentMessage = await sendMessage(supabase.current, {
      conversation_id: state.conversation.id,
      message
    });

    if (!sentMessage) {
      // Remove optimistic message on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== optimisticMessage.id),
        error: 'Failed to send message'
      }));
    }
  };

  const handleTyping = () => {
    if (!state.conversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing
    broadcastTyping(
      supabase.current,
      state.conversation.id,
      'user-id', // This should come from auth
      'You',
      true
    );

    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (state.conversation) {
        broadcastTyping(
          supabase.current,
          state.conversation.id,
          'user-id',
          'You',
          false
        );
      }
    }, 3000);
  };

  const handleCloseConversation = async () => {
    if (!state.conversation) return;
    
    await closeConversation(supabase.current, state.conversation.id);
    setShowRating(true);
  };

  const handleSubmitRating = async () => {
    if (!state.conversation || rating === 0) return;
    
    await rateConversation(
      supabase.current, 
      state.conversation.id,
      rating,
      feedback
    );
    
    // Reset state
    setState({
      isOpen: false,
      isMinimized: false,
      conversation: undefined,
      messages: [],
      isLoading: false,
      isTyping: false,
      typingUser: undefined,
      error: undefined,
      unreadCount: 0
    });
    
    setShowRating(false);
    setRating(0);
    setFeedback('');
  };

  const positionClasses = preferences.position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className={`fixed ${positionClasses} z-50 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow`}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
            {state.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {state.unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={`fixed ${positionClasses} z-50 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${
              state.isMinimized ? 'h-16' : 'h-[600px]'
            } flex flex-col transition-all duration-300`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-semibold">Unite Group Support</h3>
                  <p className="text-xs opacity-80">We typically reply in minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label={state.isMinimized ? "Maximize chat" : "Minimize chat"}
                >
                  {state.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!state.isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {state.messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Welcome! How can we help you today?
                      </p>
                    </div>
                  )}
                  
                  {state.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.sender_type === 'user'
                            ? 'bg-primary-600 text-white'
                            : message.sender_type === 'system'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 italic'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {message.sender_type === 'operator' && (
                          <p className="text-xs font-medium mb-1 opacity-80">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-60">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.sender_type === 'user' && (
                            message.is_read ? (
                              <CheckCheck className="w-3 h-3 opacity-60" />
                            ) : (
                              <Check className="w-3 h-3 opacity-60" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {state.isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {state.typingUser} is typing...
                        </p>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Rating Form */}
                {showRating && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium mb-2">How was your experience?</p>
                    <div className="flex justify-center space-x-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-colors"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Any additional feedback? (optional)"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleSubmitRating}
                      disabled={rating === 0}
                      className="mt-2 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}

                {/* Input Area */}
                {!showRating && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-end space-x-2">
                      <button 
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Attach file"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Add emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <textarea
                        ref={inputRef}
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        rows={1}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="Send message"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      By sending a message, you agree to our{' '}
                      <a href="/privacy" className="underline">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
