'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Rocket, Clock, DollarSign, Sparkles, Zap, Play, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StartBuildingCTAProps {
  variant?: 'primary' | 'secondary' | 'hero' | 'inline' | 'floating';
  productType?: string;
  timeEstimate?: string;
  price?: string;
  features?: string[];
  className?: string;
}

export default function StartBuildingCTA({ 
  variant = 'primary',
  productType = 'your website',
  timeEstimate = '45 minutes',
  price = '$0 to start',
  features = [],
  className = ''
}: StartBuildingCTAProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const variants = {
    primary: {
      button: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      size: 'px-8 py-4 text-lg',
      icon: Rocket
    },
    secondary: {
      button: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
      size: 'px-6 py-3 text-md',
      icon: ArrowRight
    },
    hero: {
      button: 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-2xl',
      size: 'px-10 py-5 text-xl',
      icon: Zap
    },
    inline: {
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      size: 'px-4 py-2 text-sm',
      icon: Play
    },
    floating: {
      button: 'bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700 shadow-xl',
      size: 'px-8 py-4 text-lg',
      icon: Sparkles
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setShowQuickStart(true)}
            className={`
              ${config.button} 
              ${config.size}
              rounded-xl font-bold transition-all duration-300 
              flex items-center justify-center gap-2 group
              relative overflow-hidden
            `}
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            <Icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">
              Start Building {productType && `Your ${productType}`}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Hover Info Bubble */}
        <AnimatePresence>
          {isHovered && (timeEstimate || price) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
            >
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">
                <div className="flex items-center gap-4">
                  {timeEstimate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeEstimate}</span>
                    </div>
                  )}
                  {price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{price}</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Indicators */}
        {variant === 'hero' && (
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Start Modal */}
      <AnimatePresence>
        {showQuickStart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickStart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8"
            >
              <h3 className="text-2xl font-bold mb-4">Ready to Take Control?</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Choose Your Tools</h4>
                    <p className="text-sm text-gray-600">Select only the features you need from our platform</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Build in Minutes</h4>
                    <p className="text-sm text-gray-600">Use our drag-and-drop tools to create your {productType || 'solution'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Launch & Grow</h4>
                    <p className="text-sm text-gray-600">Go live instantly and start seeing results today</p>
                  </div>
                </div>
              </div>

              {features.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Included Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href="/showcase"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all text-center"
                >
                  Start Free Trial
                </Link>
                <button
                  onClick={() => setShowQuickStart(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all"
                >
                  Learn More
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Floating CTA that appears on scroll
export function FloatingStartBuildingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-8 right-8 z-40"
        >
          <StartBuildingCTA 
            variant="floating"
            productType=""
            timeEstimate="45 min"
            price="Free trial"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}