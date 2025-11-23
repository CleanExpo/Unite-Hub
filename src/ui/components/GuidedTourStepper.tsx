'use client';

/**
 * Guided Tour Stepper
 * Phase 72: Reusable step overlay component for guided tours
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { GuidedTour, TourStep } from '@/lib/guides/roleGuidedTourConfig';

interface GuidedTourStepperProps {
  tour: GuidedTour;
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  className?: string;
}

export function GuidedTourStepper({
  tour,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
  onComplete,
  className = '',
}: GuidedTourStepperProps) {
  const [isVisible, setIsVisible] = useState(true);
  const currentStep = tour.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tour.steps.length - 1;
  const progress = ((currentStepIndex + 1) / tour.steps.length) * 100;

  if (!isVisible || !currentStep) {
    return null;
  }

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {currentStepIndex + 1} of {tour.steps.length}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                ~{tour.estimatedMinutes} min
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-lg">{currentStep.title}</CardTitle>
          <Progress value={progress} className="h-1" />
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Lightbulb className="h-3 w-3 text-yellow-500" />
                Tips
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {currentStep.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentStep.targetPage && (
            <div className="text-xs text-muted-foreground">
              Page: <code className="bg-muted px-1 py-0.5 rounded">{currentStep.targetPage}</code>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </div>

          {isLastStep ? (
            <Button size="sm" onClick={handleComplete}>
              {currentStep.actionLabel || 'Complete Tour'}
            </Button>
          ) : (
            <Button size="sm" onClick={onNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Hook to manage tour state
 */
export function useGuidedTour(tour: GuidedTour) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const startTour = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const endTour = () => {
    setIsActive(false);
  };

  const nextStep = () => {
    const currentStep = tour.steps[currentStepIndex];
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.stepId]);
    }
    if (currentStepIndex < tour.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
  };

  const completeTour = () => {
    const currentStep = tour.steps[currentStepIndex];
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.stepId]);
    }
    setIsActive(false);
  };

  return {
    isActive,
    currentStepIndex,
    completedSteps,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  };
}

export default GuidedTourStepper;
