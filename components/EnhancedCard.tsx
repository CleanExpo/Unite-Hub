'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Sparkles, TrendingUp, Clock, Users } from 'lucide-react';

interface EnhancedCardProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  image?: string;
  link?: string;
  linkText?: string;
  badge?: string;
  stats?: { label: string; value: string }[];
  variant?: 'default' | 'gradient' | 'glass' | 'neon' | '3d';
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  className?: string;
  onClick?: () => void;
}

export default function EnhancedCard({
  title,
  description,
  icon: Icon,
  image,
  link,
  linkText = 'Learn more',
  badge,
  stats,
  variant = 'default',
  color = 'blue',
  className = '',
  onClick
}: EnhancedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      hover: 'hover:border-blue-300',
      glow: 'shadow-blue-500/50'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      hover: 'hover:border-purple-300',
      glow: 'shadow-purple-500/50'
    },
    green: {
      gradient: 'from-green-500 to-teal-500',
      border: 'border-green-200',
      bg: 'bg-green-50',
      text: 'text-green-600',
      hover: 'hover:border-green-300',
      glow: 'shadow-green-500/50'
    },
    orange: {
      gradient: 'from-orange-500 to-red-500',
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      hover: 'hover:border-orange-300',
      glow: 'shadow-orange-500/50'
    },
    pink: {
      gradient: 'from-pink-500 to-rose-500',
      border: 'border-pink-200',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      hover: 'hover:border-pink-300',
      glow: 'shadow-pink-500/50'
    }
  };

  const colors = colorClasses[color];

  const variantClasses = {
    default: `bg-white border ${colors.border} ${colors.hover} shadow-lg hover:shadow-xl`,
    gradient: `bg-gradient-to-br ${colors.gradient} text-white shadow-xl`,
    glass: 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl',
    neon: `bg-gray-900 border-2 ${colors.border} shadow-lg hover:shadow-2xl hover:${colors.glow}`,
    '3d': 'bg-white shadow-xl transform-gpu perspective-1000'
  };

  const cardContent = (
    <motion.div
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300
        ${variantClasses[variant]}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={variant === '3d' ? {
        rotateX: (mousePosition.y - 50) * 0.1,
        rotateY: (mousePosition.x - 50) * 0.1,
        scale: 1.02
      } : { scale: 1.02 }}
      onClick={onClick}
      style={variant === '3d' ? {
        transformStyle: 'preserve-3d'
      } : {}}
    >
      {/* Background Effects */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
      )}

      {variant === 'neon' && isHovered && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-10`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
        />
      )}

      {/* Spotlight Effect */}
      {(variant === 'glass' || variant === 'neon') && (
        <motion.div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1), transparent 40%)`
          }}
        />
      )}

      {/* Image */}
      {image && (
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          {badge && (
            <div className={`absolute top-4 right-4 px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-semibold`}>
              {badge}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          {Icon && (
            <motion.div
              className={`
                p-3 rounded-xl flex-shrink-0
                ${variant === 'gradient' || variant === 'neon' ? 'bg-white/20' : `${colors.bg} ${colors.text}`}
              `}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          )}
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${
              variant === 'gradient' || variant === 'glass' ? 'text-white' : 
              variant === 'neon' ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <p className={`text-sm ${
              variant === 'gradient' || variant === 'glass' ? 'text-white/90' :
              variant === 'neon' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {description}
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-2 rounded-lg ${
                  variant === 'gradient' || variant === 'glass' ? 'bg-white/10' :
                  variant === 'neon' ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                <div className={`text-lg font-bold ${
                  variant === 'gradient' || variant === 'glass' || variant === 'neon' ? 'text-white' : colors.text
                }`}>
                  {stat.value}
                </div>
                <div className={`text-xs ${
                  variant === 'gradient' || variant === 'glass' ? 'text-white/70' :
                  variant === 'neon' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Link */}
        {link && (
          <motion.div
            className={`flex items-center gap-2 font-medium ${
              variant === 'gradient' || variant === 'glass' ? 'text-white' :
              variant === 'neon' ? colors.text : colors.text
            }`}
            whileHover={{ x: 5 }}
          >
            <span>{linkText}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        )}
      </div>

      {/* Hover Overlay */}
      <AnimatePresence>
        {isHovered && variant === 'default' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 pointer-events-none`}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return link ? (
    <Link href={link} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

// Card Grid Component
export function CardGrid({ 
  cards, 
  columns = 3 
}: { 
  cards: EnhancedCardProps[]; 
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <EnhancedCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}

// Feature Card with Icon Animation
export function FeatureCard({
  title,
  description,
  icon: Icon,
  color = 'blue',
  delay = 0
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color?: 'blue' | 'purple' | 'green' | 'orange';
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    blue: 'from-blue-400 to-cyan-400',
    purple: 'from-purple-400 to-pink-400',
    green: 'from-green-400 to-teal-400',
    orange: 'from-orange-400 to-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      
      <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <motion.div
          className={`w-14 h-14 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-4`}
          animate={isHovered ? {
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>

        <motion.div
          className="mt-4 flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ x: 5 }}
        >
          <span>Learn more</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </motion.div>
      </div>
    </motion.div>
  );
}