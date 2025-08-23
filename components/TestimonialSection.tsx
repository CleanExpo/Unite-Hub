'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  image?: string;
  videoUrl?: string;
  highlight?: string;
  stats?: { label: string; value: string }[];
}

interface TestimonialSectionProps {
  testimonials: Testimonial[];
  variant?: 'carousel' | 'grid' | 'masonry' | 'featured';
  autoPlay?: boolean;
  interval?: number;
  showStats?: boolean;
  className?: string;
}

export default function TestimonialSection({
  testimonials,
  variant = 'carousel',
  autoPlay = true,
  interval = 5000,
  showStats = true,
  className = ''
}: TestimonialSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (isPlaying && variant === 'carousel') {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [isPlaying, testimonials.length, interval, variant]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (variant === 'carousel') {
    return (
      <div className={`relative ${className}`}>
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <TestimonialCard 
                testimonial={testimonials[currentIndex]} 
                variant="featured"
                showStats={showStats}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-blue-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow ml-4"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-gray-700" />
              ) : (
                <Play className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TestimonialCard testimonial={testimonial} showStats={showStats} />
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'masonry') {
    return (
      <div className={`columns-1 md:columns-2 lg:columns-3 gap-6 ${className}`}>
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="break-inside-avoid mb-6"
          >
            <TestimonialCard 
              testimonial={testimonial} 
              variant="compact"
              showStats={showStats}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  // Featured variant
  return (
    <div className={className}>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Main Featured Testimonial */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <TestimonialCard 
            testimonial={testimonials[0]} 
            variant="featured"
            showStats={showStats}
          />
        </motion.div>

        {/* Secondary Testimonials */}
        <div className="space-y-4">
          {testimonials.slice(1, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
            >
              <TestimonialCard 
                testimonial={testimonial} 
                variant="compact"
                showStats={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Testimonial Card
function TestimonialCard({ 
  testimonial, 
  variant = 'default',
  showStats = true 
}: { 
  testimonial: Testimonial; 
  variant?: 'default' | 'compact' | 'featured';
  showStats?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variantClasses = {
    default: 'bg-white rounded-2xl shadow-lg p-6',
    compact: 'bg-white rounded-xl shadow-md p-4',
    featured: 'bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border border-blue-100'
  };

  return (
    <motion.div
      className={`relative ${variantClasses[variant]} transition-all duration-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
    >
      {/* Quote Icon */}
      <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
        <Quote className="w-6 h-6 text-white" />
      </div>

      {/* Rating */}
      <div className="flex mb-4 mt-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < testimonial.rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Highlight */}
      {testimonial.highlight && variant === 'featured' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-bold text-gray-900 mb-3"
        >
          "{testimonial.highlight}"
        </motion.p>
      )}

      {/* Content */}
      <p className={`text-gray-700 mb-4 ${
        variant === 'compact' ? 'text-sm' : 
        variant === 'featured' ? 'text-lg' : ''
      }`}>
        "{testimonial.content}"
      </p>

      {/* Stats */}
      {showStats && testimonial.stats && variant !== 'compact' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {testimonial.stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-2 bg-white rounded-lg"
            >
              <div className="text-lg font-bold text-blue-600">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 mt-4">
        {testimonial.image ? (
          <motion.img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
            whileHover={{ scale: 1.1 }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-sm text-gray-600">
            {testimonial.role} at {testimonial.company}
          </p>
        </div>
      </div>

      {/* Video Play Button */}
      {testimonial.videoUrl && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Play className="w-5 h-5 text-blue-600 ml-0.5" />
        </motion.button>
      )}

      {/* Hover Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Video Testimonial Modal
export function VideoTestimonial({ 
  videoUrl, 
  thumbnail,
  name,
  role,
  company 
}: { 
  videoUrl: string;
  thumbnail: string;
  name: string;
  role: string;
  company: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer"
        onClick={() => setIsPlaying(true)}
      >
        <img 
          src={thumbnail} 
          alt={`${name} testimonial`}
          className="w-full h-64 object-cover"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <Play className="w-10 h-10 text-blue-600 ml-1" />
          </motion.div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <p className="font-semibold">{name}</p>
          <p className="text-sm opacity-90">{role} at {company}</p>
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}