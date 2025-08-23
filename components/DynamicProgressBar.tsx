'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Circle, BookOpen, Trophy, Zap, Clock } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ProgressSection {
  id: string;
  title: string;
  description?: string;
  timeEstimate?: string;
}

interface DynamicProgressBarProps {
  sections: ProgressSection[];
  onComplete?: () => void;
  showRewards?: boolean;
  className?: string;
}

export default function DynamicProgressBar({ 
  sections, 
  onComplete,
  showRewards = true,
  className = ''
}: DynamicProgressBarProps) {
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [currentSection, setCurrentSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute('data-section-id');
        if (!sectionId) return;

        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        
        if (entry.isIntersecting) {
          setCurrentSection(sectionIndex);
          
          // Auto-complete sections as user scrolls past them
          if (sectionIndex > 0) {
            const prevSections = sections.slice(0, sectionIndex);
            setCompletedSections(prev => {
              const newSet = new Set(prev);
              prevSections.forEach(section => newSet.add(section.id));
              return newSet;
            });
          }
        }
      });
    }, observerOptions);

    // Observe all section elements
    sectionRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const progressPercentage = Math.round((completedSections.size / sections.length) * 100);
  const estimatedTimeRemaining = sections
    .filter(s => !completedSections.has(s.id))
    .reduce((total, section) => {
      const time = parseInt(section.timeEstimate?.match(/\d+/)?.[0] || '0');
      return total + time;
    }, 0);

  const handleSectionClick = (sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const markAsComplete = (sectionId: string) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionId);
      
      if (newSet.size === sections.length && onComplete) {
        onComplete();
      }
      
      return newSet;
    });
  };

  return (
    <>
      {/* Fixed Progress Bar */}
      <div className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-30 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Main Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Your Progress
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    ~{estimatedTimeRemaining} min remaining
                  </span>
                </div>
                <div className="font-bold text-blue-600">
                  {progressPercentage}% Complete
                </div>
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                style={{ width: progressWidth }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </motion.div>
            </div>

            {/* Section Indicators */}
            <div className="relative mt-2">
              <div className="flex justify-between">
                {sections.map((section, index) => {
                  const isCompleted = completedSections.has(section.id);
                  const isCurrent = index === currentSection;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`
                        flex flex-col items-center group cursor-pointer
                        ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}
                      `}
                      title={section.title}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-all
                        ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100 scale-110' : 'bg-gray-100'}
                        group-hover:scale-110
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Circle className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <span className="text-xs mt-1 hidden lg:block max-w-[100px] truncate">
                        {section.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Achievement Notification */}
          {showRewards && progressPercentage > 0 && progressPercentage % 25 === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {progressPercentage === 100 ? '🎉 Congratulations! You completed the guide!' : 
                 progressPercentage === 75 ? 'Almost there! Keep going!' :
                 progressPercentage === 50 ? 'Halfway through! You\'re doing great!' :
                 'Great start! Keep learning!'}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content Container with Section Markers */}
      <div ref={containerRef} className="pt-24">
        {sections.map((section, index) => (
          <div
            key={section.id}
            ref={(el) => {
              if (el) sectionRefs.current.set(section.id, el);
            }}
            data-section-id={section.id}
            className="min-h-[500px] py-8"
          >
            {/* Section Header */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${completedSections.has(section.id) 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentSection 
                      ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-200' 
                      : 'bg-gray-100 text-gray-400'}
                  `}>
                    {completedSections.has(section.id) ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="text-gray-600">{section.description}</p>
                    )}
                    {section.timeEstimate && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Estimated time: {section.timeEstimate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!completedSections.has(section.id) && index === currentSection && (
                  <button
                    onClick={() => markAsComplete(section.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Compact version for sidebar
export function CompactProgressBar({ 
  sections, 
  completedSections 
}: { 
  sections: ProgressSection[]; 
  completedSections: Set<string>;
}) {
  const progressPercentage = Math.round((completedSections.size / sections.length) * 100);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="space-y-2">
        {sections.map((section) => {
          const isCompleted = completedSections.has(section.id);
          
          return (
            <div key={section.id} className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={`text-xs ${isCompleted ? 'text-gray-700 line-through' : 'text-gray-500'}`}>
                {section.title}
              </span>
            </div>
          );
        })}
      </div>

      {progressPercentage === 100 && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">
              Course Completed!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Gamified version with rewards
export function GamifiedProgressBar({ sections }: { sections: ProgressSection[] }) {
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const achievements = [
    { threshold: 25, badge: '🔥 Quick Starter', points: 100 },
    { threshold: 50, badge: '⚡ Halfway Hero', points: 200 },
    { threshold: 75, badge: '🚀 Almost There', points: 300 },
    { threshold: 100, badge: '🏆 Master Builder', points: 500 }
  ];

  return (
    <div className="fixed bottom-8 left-8 bg-white rounded-xl shadow-2xl p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-gray-900">{points} pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Streak:</span>
          <span className="font-bold text-orange-600">{streak} 🔥</span>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {badges.map((badge, idx) => (
            <span key={idx} className="text-sm bg-yellow-100 px-2 py-1 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-600">
        Complete sections to earn points and badges!
      </div>
    </div>
  );
}