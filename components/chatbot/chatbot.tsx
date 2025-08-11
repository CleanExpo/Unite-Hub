"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  User,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useCustomChat } from './use-custom-chat';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [meetingScheduled, setMeetingScheduled] = useState(false);
  const [contactInfo, setContactInfo] = useState({ 
    name: '', 
    email: '', 
    date: '', 
    time: '', 
    timezone: '' 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setInput,
  } = useCustomChat([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm Alex from Unite Group. 👋 I'm here to help you understand how we can solve your business challenges. What brings you here today?",
    },
  ]);

  // Check if the conversation involves scheduling
  useEffect(() => {
    // Don't run this effect if we're already collecting info or submitting
    if (isCollectingInfo || isSubmittingMeeting) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const hasMeetingInfo = messages.some(msg => 
      msg.role === 'user' && 
      msg.content.includes('Name:') && 
      msg.content.includes('Email:') &&
      msg.content.includes('Date:') &&
      msg.content.includes('Time:') &&
      msg.content.includes('Timezone:')
    );
    
    // Check if we've already received a confirmation response
    const hasConfirmation = messages.some(msg => 
      msg.role === 'assistant' && 
      msg.content.includes('Perfect! Thank you')
    );
    

    
    // Check if the user has confirmed they want a meeting
    const userConfirmedMeeting = messages.some(msg => 
      msg.role === 'user' && 
      (msg.content.toLowerCase().includes('yes') || 
       msg.content.toLowerCase().includes('sure') ||
       msg.content.toLowerCase().includes('okay') ||
       msg.content.toLowerCase().includes('ok') ||
       msg.content.toLowerCase().includes('i would like') ||
       msg.content.toLowerCase().includes('i want') ||
       msg.content.toLowerCase().includes('please') ||
       msg.content.toLowerCase().includes('that would be great'))
    );
    
    // Only show contact form if:
    // 1. User has confirmed they want a meeting
    // 2. Last message is from assistant asking for meeting details
    // 3. We haven't already collected meeting info
    // 4. We haven't already received confirmation
    // 5. We haven't already scheduled a meeting in this session
    // 6. We're not currently showing success message
    if (userConfirmedMeeting &&
        lastMessage?.role === 'assistant' && 
        !hasMeetingInfo &&
        !hasConfirmation &&
        !meetingScheduled &&
        !showSuccessMessage &&
        (lastMessage.content.includes('name, email address, preferred date, time, and timezone') || 
         lastMessage.content.includes('calendar invite') ||
         lastMessage.content.includes('schedule your consultation'))) {
      setIsCollectingInfo(true);
    }
    
    // Auto-hide the form when we receive confirmation
    if (isCollectingInfo && hasConfirmation) {
      // Mark meeting as scheduled to prevent form from showing again
      setMeetingScheduled(true);
      
      // Immediately hide the form to prevent any flickering
      setIsCollectingInfo(false);
      
      // Show success message first
      setShowSuccessMessage(true);
      
      // Hide success message after delay and ensure form stays hidden
      setTimeout(() => {
        setShowSuccessMessage(false);
        // Double-check that form is hidden
        setIsCollectingInfo(false);
        setContactInfo({ name: '', email: '', date: '', time: '', timezone: '' });
      }, 1500); // 1.5 second delay to show success message
    }
  }, [messages, isCollectingInfo, isSubmittingMeeting]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Cleanup effect to ensure form doesn't show after meeting is scheduled
  useEffect(() => {
    if (meetingScheduled) {
      // Ensure form is hidden when meeting is scheduled
      setIsCollectingInfo(false);
      setShowSuccessMessage(false);
    }
  }, [meetingScheduled]);

  const handleToggle = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else if (!isOpen) {
      // Opening chat - reset meeting state for new session
      setIsOpen(true);
      setIsMinimized(false);
      setMeetingScheduled(false);
      setIsCollectingInfo(false);
      setShowSuccessMessage(false);
      setContactInfo({ name: '', email: '', date: '', time: '', timezone: '' });
    } else {
      // Closing chat
      setIsOpen(false);
      setIsMinimized(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await handleSubmit();
    }
  };

  const handleMeetingSubmit = async () => {
    if (contactInfo.name && contactInfo.email && contactInfo.date && contactInfo.time && contactInfo.timezone) {
      setIsSubmittingMeeting(true);
      
      try {
        const meetingDetails = `Name: ${contactInfo.name}, Email: ${contactInfo.email}, Date: ${contactInfo.date}, Time: ${contactInfo.time}, Timezone: ${contactInfo.timezone}`;
        
        // Submit the form with meeting details
        setInput(meetingDetails);
        
        // Wait for the API call to complete
        await handleSubmit();
        
        // Mark as scheduled immediately to prevent form from showing again
        setMeetingScheduled(true);
        
        // Don't clear the form immediately - let the useEffect handle it
        // The form will be cleared when the assistant responds
      } catch (error) {
        console.error('Error submitting meeting:', error);
        // Keep form open if there's an error
      } finally {
        setIsSubmittingMeeting(false);
      }
    }
  };

  const quickQuestions = [
    "What services do you offer?",
    "How much do your services cost?",
    "Can you help with my business growth?",
    "Tell me about your case studies",
  ];

  // Common timezones
  const timezones = [
    { value: 'AEST', label: 'AEST (UTC+10)' },
    { value: 'AEDT', label: 'AEDT (UTC+11)' },
    { value: 'PST', label: 'PST (UTC-8)' },
    { value: 'EST', label: 'EST (UTC-5)' },
    { value: 'CST', label: 'CST (UTC-6)' },
    { value: 'MST', label: 'MST (UTC-7)' },
    { value: 'GMT', label: 'GMT (UTC+0)' },
    { value: 'CET', label: 'CET (UTC+1)' },
    { value: 'IST', label: 'IST (UTC+5:30)' },
    { value: 'JST', label: 'JST (UTC+9)' },
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={handleToggle}
          className="relative bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-16 h-16 shadow-2xl border-0"
          size="lg"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={24} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Notification dot */}
          {!isOpen && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }}
            />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Bot size={20} />
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">Alex from Unite Group</h3>
                      <p className="text-xs text-cyan-100">Online • Ready to help</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              {!isMinimized && (
                <div className="h-[500px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {message.role === 'assistant' && (
                                <Bot size={16} className="text-cyan-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <User size={16} className="text-white/80 mt-0.5 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Quick Questions */}
                    {messages.length === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-2"
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          Quick questions you might have:
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {quickQuestions.map((question, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950 hover:border-cyan-300 text-xs"
                              onClick={async () => {
                                setInput(question);
                                await handleSubmit();
                              }}
                            >
                              {question}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Bot size={16} className="text-cyan-500" />
                            <div className="flex space-x-1">
                              <motion.div
                                className="w-2 h-2 bg-cyan-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-cyan-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-cyan-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Sorry, I'm having trouble connecting right now. Please try again in a moment.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Meeting Form or Input Form */}
                  {isCollectingInfo && !isSubmittingMeeting && !meetingScheduled && !showSuccessMessage ? (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                          📅 Let's schedule your consultation!
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={contactInfo.name}
                          onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          className="border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                        />
                        <Input
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Your email address"
                          type="email"
                          className="border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                        />
                        <Input
                          value={contactInfo.date}
                          onChange={(e) => setContactInfo(prev => ({ ...prev, date: e.target.value }))}
                          placeholder="Preferred date (e.g., Dec 15, 2024)"
                          className="border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                        />
                        <Input
                          value={contactInfo.time}
                          onChange={(e) => setContactInfo(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="Preferred time (e.g., 2:00 PM)"
                          className="border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                        />
                        <Select
                          value={contactInfo.timezone}
                          onValueChange={(value) => setContactInfo(prev => ({ ...prev, timezone: value }))}
                        >
                          <SelectTrigger className="border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400">
                            <SelectValue placeholder="Select your timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleMeetingSubmit}
                            disabled={!contactInfo.name || !contactInfo.email || !contactInfo.date || !contactInfo.time || !contactInfo.timezone || isSubmittingMeeting}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                            size="sm"
                          >
                            {isSubmittingMeeting ? 'Sending...' : 'Send Calendar Invite'}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsCollectingInfo(false);
                              setContactInfo({ name: '', email: '', date: '', time: '', timezone: '' });
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : showSuccessMessage ? (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                        <div className="text-green-600 dark:text-green-400 mb-2">
                          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          Meeting Confirmed
                        </p>
                        <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                          Confirmation email sent. Our team will contact you within 24 hours.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex space-x-2">
                        <Input
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Type your message..."
                          className="flex-1 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400"
                          disabled={isLoading}
                        />
                        <Button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4"
                          size="sm"
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 