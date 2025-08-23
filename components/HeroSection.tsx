'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, CheckCircle } from 'lucide-react';

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle: string;
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
    icon?: React.ElementType;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    icon?: React.ElementType;
  };
  features?: string[];
  variant?: 'default' | 'gradient' | 'dark' | 'video' | 'animated';
  backgroundImage?: string;
  videoUrl?: string;
  children?: React.ReactNode;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  features,
  variant = 'gradient',
  backgroundImage,
  videoUrl,
  children
}: HeroSectionProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const backgroundVariants = {
    default: 'bg-gradient-to-br from-blue-600 to-purple-700',
    gradient: 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600',
    dark: 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900',
    video: 'bg-black/50',
    animated: 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'
  };

  return (
    <section className={`relative min-h-[90vh] flex items-center overflow-hidden ${
      variant !== 'video' ? backgroundVariants[variant] : ''
    }`}>
      {/* Video Background */}
      {variant === 'video' && videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Background Image with Parallax */}
      {backgroundImage && (
        <motion.div
          style={{ y }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
        </motion.div>
      )}

      {/* Animated Background Elements */}
      {variant === 'animated' && (
        <>
          {/* Floating Orbs */}
          <motion.div
            animate={{
              x: mousePosition.x,
              y: mousePosition.y,
            }}
            transition={{ type: "spring", stiffness: 50 }}
            className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-[120px] opacity-30"
          />
          <motion.div
            animate={{
              x: -mousePosition.x,
              y: -mousePosition.y,
            }}
            transition={{ type: "spring", stiffness: 50 }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-30"
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
          
          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
                }}
                animate={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
                }}
                transition={{
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="absolute w-1 h-1 bg-white rounded-full opacity-50"
              />
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32"
      >
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 mr-2" />
            <span className="text-white/90 text-sm font-medium">{subtitle}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight"
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed"
            >
              {description}
            </motion.p>
          )}

          {/* Features List */}
          {features && features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-3 mb-8"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-white/90">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {primaryCTA && (
              <Link
                href={primaryCTA.href}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center group-hover:text-white transition-colors duration-300">
                  {primaryCTA.text}
                  {primaryCTA.icon ? (
                    <primaryCTA.icon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              </Link>
            )}

            {secondaryCTA && (
              <Link
                href={secondaryCTA.href}
                className="group inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
              >
                {secondaryCTA.icon && <secondaryCTA.icon className="mr-2 w-5 h-5" />}
                {secondaryCTA.text}
              </Link>
            )}
          </motion.div>

          {/* Custom Children */}
          {children && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8"
            >
              {children}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Split Hero with Image/Video
export function SplitHero({
  title,
  subtitle,
  description,
  mediaUrl,
  mediaType = 'image',
  primaryCTA,
  secondaryCTA,
  features
}: HeroSectionProps & { mediaUrl: string; mediaType?: 'image' | 'video' }) {
  return (
    <section className="relative min-h-[80vh] bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{subtitle}</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
              {title}
            </h1>

            {description && (
              <p className="text-xl text-gray-600 mb-8">
                {description}
              </p>
            )}

            {features && (
              <div className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {primaryCTA && (
                <Link
                  href={primaryCTA.href}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  {primaryCTA.text}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              )}
              {secondaryCTA && (
                <Link
                  href={secondaryCTA.href}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:border-gray-400 transition-colors"
                >
                  {secondaryCTA.text}
                </Link>
              )}
            </div>
          </motion.div>

          {/* Media */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {mediaType === 'image' ? (
                <img 
                  src={mediaUrl} 
                  alt="Hero media"
                  className="w-full h-auto"
                />
              ) : (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                >
                  <source src={mediaUrl} type="video/mp4" />
                </video>
              )}
              
              {/* Play Button Overlay for Video */}
              {mediaType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-lg">
                    <Play className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-50" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
