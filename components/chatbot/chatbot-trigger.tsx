"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatbot } from './chatbot-provider';

interface ChatbotTriggerProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export default function ChatbotTrigger({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  showIcon = true,
}: ChatbotTriggerProps) {
  const { showChatbot } = useChatbot();

  const defaultContent = (
    <>
      {showIcon && <MessageCircle size={16} className="mr-2" />}
      Chat with us
    </>
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={showChatbot}
        variant={variant}
        size={size}
        className={`${className} ${
          variant === 'default' 
            ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
            : ''
        }`}
      >
        {children || defaultContent}
      </Button>
    </motion.div>
  );
}

// Special floating trigger for pages
export function FloatingChatbotTrigger() {
  const { showChatbot } = useChatbot();

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      <Button
        onClick={showChatbot}
        className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-14 h-14 shadow-2xl border-0 group"
        size="lg"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <MessageCircle size={20} />
        </motion.div>
        
        {/* Sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles size={12} className="text-yellow-300" />
        </motion.div>
      </Button>
    </motion.div>
  );
} 