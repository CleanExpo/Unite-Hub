'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, Rocket, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComingSoonBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed in this session
    const dismissed = sessionStorage.getItem('comingSoonBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('comingSoonBannerDismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm"
                >
                  <Rocket className="w-5 h-5 text-white" />
                </motion.div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 animate-pulse" />
                    <span className="font-bold text-sm sm:text-base">COMING SOON</span>
                  </div>
                  <span className="text-xs sm:text-sm text-white/90">
                    We're currently in development. Full launch scheduled for Q1 2025.
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <motion.a
                  href="/consultation"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:flex items-center space-x-2 bg-white text-blue-600 px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Get Early Access</span>
                </motion.a>
                
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 sm:hidden">
              <motion.a
                href="/consultation"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors w-full"
              >
                <Calendar className="w-4 h-4" />
                <span>Get Early Access</span>
              </motion.a>
            </div>
          </div>

          {/* Animated progress bar */}
          <motion.div
            className="h-1 bg-white/30"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alternative minimal version for environments where Framer Motion might not be available
export function ComingSoonBannerMinimal() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('comingSoonBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('comingSoonBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-bold">🚀 COMING SOON</span>
            <span className="text-sm text-white/90">
              Website under development - Launch Q1 2025
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}