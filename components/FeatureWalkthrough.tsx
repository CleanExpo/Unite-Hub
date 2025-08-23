'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCw, Check, Clock, Zap, MousePointer } from 'lucide-react';

interface WalkthroughStep {
  title: string;
  description: string;
  duration: string;
  preview: string; // This would be a video URL or GIF in production
}

interface FeatureWalkthroughProps {
  feature: string;
  steps: WalkthroughStep[];
  totalTime: string;
  result: string;
}

export default function FeatureWalkthrough({ feature, steps, totalTime, result }: FeatureWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((step) => {
              if (step < steps.length - 1) {
                return step + 1;
              } else {
                setIsPlaying(false);
                return step;
              }
            });
            return 0;
          }
          return prev + 2;
        });
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, steps.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h3 className="text-2xl font-bold mb-2">Build {feature} in {totalTime}</h3>
        <p className="text-white/90">Watch how easy it is. No coding. No agencies. Just you.</p>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Video/Preview Area */}
        <div className="lg:w-2/3 p-6 bg-gray-50">
          <div className="relative bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg aspect-video flex items-center justify-center">
            {/* Simulated Screen */}
            <div className="absolute inset-4 bg-white rounded shadow-lg p-4">
              <div className="bg-gray-100 rounded h-8 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="bg-gray-100 rounded h-4 w-3/4 animate-pulse"></div>
                <div className="bg-gray-100 rounded h-4 w-1/2 animate-pulse"></div>
              </div>
              
              {/* Simulated Cursor */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <MousePointer className="w-6 h-6 text-blue-600 animate-bounce" />
              </div>
            </div>

            {/* Play Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayPause}
                  className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleRestart}
                  className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <div className="bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-white text-sm font-medium">
                  Step {currentStep + 1}/{steps.length}
                </span>
              </div>
            </div>
          </div>

          {/* Current Step Info */}
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-1">
              {steps[currentStep].title}
            </h4>
            <p className="text-sm text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Steps Sidebar */}
        <div className="lg:w-1/3 p-6 bg-white">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Time</span>
              <span className="flex items-center text-sm font-bold text-green-600">
                <Clock className="w-4 h-4 mr-1" />
                {totalTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Difficulty</span>
              <span className="flex items-center text-sm font-bold text-blue-600">
                <Zap className="w-4 h-4 mr-1" />
                Beginner
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Steps to Complete</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : index < currentStep
                      ? 'bg-green-50 border-2 border-green-300'
                      : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 mr-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{step.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{step.duration}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Result Preview */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">🎉 End Result</h4>
            <p className="text-sm text-gray-700">{result}</p>
          </div>

          {/* CTA */}
          <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Try It Yourself →
          </button>
        </div>
      </div>
    </div>
  );
}

// Example walkthrough data
export const exampleWalkthroughs = {
  landingPage: {
    feature: 'a Landing Page',
    totalTime: '8 minutes',
    result: 'A fully responsive, SEO-optimized landing page with contact forms, analytics, and payment integration ready to convert visitors into customers.',
    steps: [
      {
        title: 'Choose Your Template',
        description: 'Browse 200+ industry-specific templates or start from scratch',
        duration: '30 seconds',
        preview: '/walkthrough/step1.gif'
      },
      {
        title: 'Customize Your Content',
        description: 'Click to edit text, drag to rearrange sections, upload your images',
        duration: '3 minutes',
        preview: '/walkthrough/step2.gif'
      },
      {
        title: 'Add Power Features',
        description: 'Enable contact forms, chat widget, payment buttons with one click',
        duration: '2 minutes',
        preview: '/walkthrough/step3.gif'
      },
      {
        title: 'Optimize for SEO',
        description: 'AI automatically generates meta tags, schema markup, and sitemap',
        duration: '1 minute',
        preview: '/walkthrough/step4.gif'
      },
      {
        title: 'Publish & Go Live',
        description: 'Connect your domain or use ours, SSL included, instantly live',
        duration: '1.5 minutes',
        preview: '/walkthrough/step5.gif'
      }
    ]
  },
  emailCampaign: {
    feature: 'an Email Campaign',
    totalTime: '5 minutes',
    result: 'A complete email marketing campaign with automated sequences, A/B testing, and detailed analytics tracking.',
    steps: [
      {
        title: 'Select Campaign Type',
        description: 'Choose from welcome series, promotional, or custom campaign',
        duration: '20 seconds',
        preview: '/walkthrough/email1.gif'
      },
      {
        title: 'Design Your Email',
        description: 'Drag-drop editor with mobile preview and spam checking',
        duration: '2 minutes',
        preview: '/walkthrough/email2.gif'
      },
      {
        title: 'Set Up Automation',
        description: 'Define triggers, delays, and conditional logic',
        duration: '1.5 minutes',
        preview: '/walkthrough/email3.gif'
      },
      {
        title: 'Import Contacts',
        description: 'Upload CSV or connect your CRM instantly',
        duration: '30 seconds',
        preview: '/walkthrough/email4.gif'
      },
      {
        title: 'Launch Campaign',
        description: 'Review, test send, and go live with tracking enabled',
        duration: '40 seconds',
        preview: '/walkthrough/email5.gif'
      }
    ]
  }
};