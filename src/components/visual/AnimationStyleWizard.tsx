'use client';

/**
 * Animation Style Wizard Component
 *
 * Step-by-step wizard for helping clients choose animation styles.
 * Mobile-friendly, accessible, and produces actionable recommendations.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Leaf,
  Zap,
  Flame,
  Briefcase,
  Minus,
  Equal,
  Sparkles,
  Wrench,
  Home,
  Building,
  Code,
  Palette,
  Landmark,
  Eye,
  Star,
  Rocket,
  BookOpen,
  MousePointer,
  Box,
  ArrowDown,
  Video,
  MinusCircle,
  Copy,
  Download,
} from 'lucide-react';
import wizardData from '@/data/animationWizardQuestions.json';
import generateRecommendations, { WizardAnswer } from '@/lib/visual/animationStyleRecommender';
import { createProfileFromWizard, StyleProfile } from '@/lib/visual/styleProfile';
import { downloadPack } from '@/lib/visual/animationPackBuilder';

// ============================================================================
// ICON MAP
// ============================================================================

const iconMap: Record<string, React.ElementType> = {
  leaf: Leaf,
  zap: Zap,
  flame: Flame,
  briefcase: Briefcase,
  minus: Minus,
  equal: Equal,
  sparkles: Sparkles,
  wrench: Wrench,
  home: Home,
  building: Building,
  code: Code,
  palette: Palette,
  landmark: Landmark,
  eye: Eye,
  star: Star,
  rocket: Rocket,
  'book-open': BookOpen,
  'mouse-pointer': MousePointer,
  box: Box,
  'arrow-down': ArrowDown,
  video: Video,
  'minus-circle': MinusCircle,
};

// ============================================================================
// TYPES
// ============================================================================

interface WizardProps {
  onComplete?: (profile: StyleProfile) => void;
  clientName?: string;
}

interface Question {
  id: string;
  step: number;
  question: string;
  helpText: string;
  type: 'single' | 'multiple';
  options: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
  }>;
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-white/60 mb-2">
        <span>Step {current} of {total}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// OPTION CARD
// ============================================================================

function OptionCard({
  option,
  isSelected,
  onClick,
  isMultiple,
}: {
  option: { id: string; label: string; description: string; icon: string };
  isSelected: boolean;
  onClick: () => void;
  isMultiple: boolean;
}) {
  const Icon = iconMap[option.icon] || Sparkles;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full p-4 rounded-xl text-left transition-all border
        ${isSelected
          ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/30'
          : 'bg-white/5 border-white/10 hover:border-white/20'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl transition-colors
          ${isSelected ? 'bg-indigo-500/30' : 'bg-white/10'}
        `}>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-300' : 'text-white/60'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-white/90'}`}>
              {option.label}
            </h4>
            {isMultiple && (
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/30'}
              `}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            )}
          </div>
          <p className="text-sm text-white/50 mt-1">{option.description}</p>
        </div>
        {!isMultiple && isSelected && (
          <div className="p-1 rounded-full bg-indigo-500">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================

function ResultsScreen({
  profile,
  onRestart,
  onDownload,
}: {
  profile: StyleProfile;
  onRestart: () => void;
  onDownload: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyStyles = async () => {
    const text = profile.preferredStyles.join(', ');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Animation Style Profile</h2>
        <p className="text-white/60">Based on your preferences, here's what we recommend.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Profile Summary</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-white/40">Target Audience</p>
            <p className="text-white capitalize">{profile.persona}</p>
          </div>
          <div>
            <p className="text-sm text-white/40">Animation Intensity</p>
            <p className="text-white capitalize">{profile.intensity}</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          {profile.features.flashlightCursor && (
            <span className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300">
              Cursor Effects
            </span>
          )}
          {profile.features.threeDElements && (
            <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
              3D Elements
            </span>
          )}
          {profile.features.scrollAnimations && (
            <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
              Scroll Animations
            </span>
          )}
          {profile.features.videoBackgrounds && (
            <span className="px-3 py-1 rounded-full text-xs bg-pink-500/20 text-pink-300">
              Video Backgrounds
            </span>
          )}
        </div>
      </div>

      {/* Recommended Styles */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recommended Styles</h3>
          <button
            onClick={copyStyles}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
        <div className="space-y-3">
          {profile.preferredStyles.map((styleId, index) => (
            <div
              key={styleId}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-white">{styleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors text-white font-medium"
        >
          <Download className="w-5 h-5" />
          Download Style Pack
        </button>
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          Start Over
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export function AnimationStyleWizard({ onComplete, clientName = 'Client' }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  const questions = wizardData.questions as Question[];
  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isComplete = profile !== null;

  // Handle option selection
  const handleSelect = useCallback((optionId: string) => {
    if (!currentQuestion) {
return;
}

    if (currentQuestion.type === 'single') {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: [optionId],
      }));
    } else {
      setAnswers(prev => {
        const current = prev[currentQuestion.id] || [];
        if (current.includes(optionId)) {
          return {
            ...prev,
            [currentQuestion.id]: current.filter(id => id !== optionId),
          };
        }
        return {
          ...prev,
          [currentQuestion.id]: [...current, optionId],
        };
      });
    }
  }, [currentQuestion]);

  // Navigation
  const goNext = useCallback(() => {
    if (isLastStep) {
      // Generate recommendations
      const wizardAnswers: WizardAnswer[] = Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds,
      }));

      const result = generateRecommendations(wizardAnswers);
      const newProfile = createProfileFromWizard(clientName, result, wizardAnswers);

      setProfile(newProfile);
      onComplete?.(newProfile);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }
  }, [isLastStep, answers, clientName, onComplete, totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setProfile(null);
  }, []);

  // Check if current question has an answer
  const hasAnswer = currentQuestion && (answers[currentQuestion.id]?.length || 0) > 0;

  // Results screen
  if (isComplete && profile) {
    return (
      <ResultsScreen
        profile={profile}
        onRestart={restart}
        onDownload={() => {
          downloadPack({
            profile,
            includeCodeSamples: true,
            includeTiming: true,
          });
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <ProgressBar current={currentStep + 1} total={totalSteps} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentQuestion && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentQuestion.question}
                </h2>
                <p className="text-white/60">{currentQuestion.helpText}</p>
                {currentQuestion.type === 'multiple' && (
                  <p className="text-sm text-indigo-400 mt-2">Select all that apply</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map(option => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isSelected={(answers[currentQuestion.id] || []).includes(option.id)}
                    onClick={() => handleSelect(option.id)}
                    isMultiple={currentQuestion.type === 'multiple'}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl transition-colors
            ${currentStep === 0
              ? 'text-white/30 cursor-not-allowed'
              : 'text-white/60 hover:text-white hover:bg-white/10'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={goNext}
          disabled={currentQuestion?.type === 'single' && !hasAnswer}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors
            ${(currentQuestion?.type === 'single' && !hasAnswer)
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }
          `}
        >
          {isLastStep ? 'See Results' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default AnimationStyleWizard;
