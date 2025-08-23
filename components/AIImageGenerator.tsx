'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, Loader2 } from 'lucide-react';

interface ImagePrompt {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: '16:9' | '1:1' | '9:16' | '4:3';
  purpose: string;
}

// Amazing, detailed prompts for each type of page
export const pageImagePrompts: Record<string, ImagePrompt[]> = {
  homepage: [
    {
      id: 'hero-main',
      prompt: 'A stunning, photorealistic image of a modern entrepreneur sitting at a minimalist white desk with a sleek laptop, looking confident and accomplished. Behind them, a massive holographic dashboard floats in the air showing real-time business metrics, growing charts, and successful KPIs in blue and purple gradients. The room has floor-to-ceiling windows overlooking Brisbane skyline at golden hour. Soft natural lighting, depth of field focusing on the entrepreneur, premium business aesthetic, shot with 85mm lens, corporate luxury style',
      style: 'photorealistic, corporate, premium',
      aspectRatio: '16:9',
      purpose: 'Hero section background'
    },
    {
      id: 'control-visual',
      prompt: 'An abstract 3D visualization of interconnected glowing nodes and pathways forming a complex network, with a central control hub emitting pulses of light that travel through the connections. The nodes transform from dim gray to vibrant blue and purple as the control signals reach them. Floating UI elements and holographic interfaces orbit around the network. Dark background with subtle grid pattern, neon accents, cyberpunk meets corporate aesthetic, ultra high detail, octane render quality',
      style: '3D abstract, futuristic, tech',
      aspectRatio: '16:9',
      purpose: 'Client control visualization'
    },
    {
      id: 'speed-comparison',
      prompt: 'Split-screen visualization: Left side shows a traditional agency meeting room with people around a table covered in papers, looking stressed, clock showing weeks passing. Right side shows a single person at home, relaxed, building a website with drag-and-drop interface on their screen, clock showing minutes. Dramatic lighting contrast between frustration (left) and satisfaction (right). Photorealistic style, high contrast, storytelling composition',
      style: 'photorealistic, comparison, storytelling',
      aspectRatio: '16:9',
      purpose: 'Time comparison visual'
    }
  ],
  showcase: [
    {
      id: 'success-collage',
      prompt: 'A dynamic collage of 12 different laptop and mobile screens displaying beautiful, diverse websites - an eco-commerce store with green products, a fitness app with workout videos, a restaurant with mouth-watering food photography, a tech startup with modern gradients. Screens are arranged in an artistic 3D space with depth, some tilted, some straight, creating an engaging gallery effect. Soft shadows, premium presentation, Apple-style product photography',
      style: 'product photography, premium, collage',
      aspectRatio: '16:9',
      purpose: 'Showcase header'
    },
    {
      id: 'entrepreneur-portraits',
      prompt: 'A diverse grid of 9 professional headshots of successful entrepreneurs - different ages, ethnicities, and industries. Each person is smiling confidently, wearing business casual attire. Soft studio lighting, consistent color grading with warm tones, shallow depth of field, shot against neutral backgrounds. Premium LinkedIn-style portraits, inclusive representation',
      style: 'portrait photography, professional, diverse',
      aspectRatio: '1:1',
      purpose: 'Client testimonials'
    }
  ],
  'growth-hacking': [
    {
      id: 'growth-rocket',
      prompt: 'A sleek metallic rocket ship made entirely of interconnected growth charts and metrics, launching upward through layers of translucent data visualizations. The rocket trail is composed of rising bar charts and exponential growth curves in gradient colors from orange to purple. Particles of numbers and percentage symbols float around. Dark space background with constellation patterns made of KPI indicators. Highly detailed, 3D render, dramatic lighting',
      style: '3D render, metaphorical, dynamic',
      aspectRatio: '16:9',
      purpose: 'Hero visual'
    },
    {
      id: 'metrics-dashboard',
      prompt: 'Ultra-modern holographic dashboard floating in a dark room, displaying real-time growth metrics: conversion rates climbing from 2% to 15%, user acquisition graphs shooting upward, revenue charts breaking through projected ceilings. Neon blue and green data streams flow between widgets. A hand reaches out to interact with the floating interface. Photorealistic rendering, cinematic lighting, tech noir aesthetic',
      style: 'UI visualization, holographic, futuristic',
      aspectRatio: '16:9',
      purpose: 'Tools demonstration'
    }
  ],
  'agile-marketing': [
    {
      id: 'agile-flow',
      prompt: 'A beautiful visualization of the agile marketing process as a flowing river system viewed from above. The river splits into multiple streams (sprints) that merge and diverge, with each stream containing floating kanban cards and task bubbles. The water is crystal clear blue, and the riverbanks are lined with milestone markers. Drone photography style, high altitude view, vibrant colors, nature meets productivity',
      style: 'aerial photography, metaphorical, flow',
      aspectRatio: '16:9',
      purpose: 'Process visualization'
    },
    {
      id: 'team-collaboration',
      prompt: 'A diverse marketing team of 6 people working in perfect synchronization around a large digital table displaying a living, breathing campaign timeline. Holographic sticky notes float above the table, reorganizing themselves in real-time. Each team member has AR glasses showing their individual tasks. Modern office space with plants, natural light streaming through windows. Photorealistic, warm color palette, human-centric',
      style: 'photorealistic, teamwork, modern office',
      aspectRatio: '16:9',
      purpose: 'Team training visual'
    }
  ],
  'social-advertising': [
    {
      id: 'social-universe',
      prompt: 'A cosmic view of social media platforms as planets in a digital solar system. Facebook as a blue giant, Instagram as a gradient purple-pink world, LinkedIn as a professional navy sphere, TikTok as a vibrant multicolor planet. Streams of targeted ads travel between planets like shooting stars, each carrying miniature product images. Data satellites orbit each planet. Space art style, ethereal glow, epic scale',
      style: 'space art, conceptual, epic',
      aspectRatio: '16:9',
      purpose: 'Platform overview'
    },
    {
      id: 'roi-visualization',
      prompt: 'A money tree growing in fast-forward time-lapse style, where each leaf is a social media post and the fruits are gold coins with ROI percentages. The roots show ad spend flowing in, the trunk shows conversion optimization, and the canopy shows revenue multiplication. Set in a digital garden with data rain nurturing growth. Surreal realism, rich colors, financial metaphor',
      style: 'surreal, growth metaphor, financial',
      aspectRatio: '4:3',
      purpose: 'ROI calculator visual'
    }
  ],
  'competitive-analysis': [
    {
      id: 'market-battlefield',
      prompt: 'A strategic war room with a massive holographic 3D map of the market landscape. Competitor positions marked as fortresses with their market share as territory. Your business shown as an advancing force with data-driven insights as weapons. Real-time intelligence feeds stream on surrounding screens. Military strategy meets corporate intelligence aesthetic, dramatic lighting, high stakes atmosphere',
      style: 'strategic, military-inspired, dramatic',
      aspectRatio: '16:9',
      purpose: 'Strategy visualization'
    },
    {
      id: 'comparison-matrix',
      prompt: 'A futuristic comparison laboratory where products from different competitors are being analyzed by laser scanners and AI systems. Holographic displays show feature comparisons, price points, and customer sentiment as floating 3D bar charts. Scientists in white coats study the data. Clean, clinical, high-tech environment with blue accent lighting',
      style: 'sci-fi laboratory, analytical, clean',
      aspectRatio: '16:9',
      purpose: 'Benchmarking visual'
    }
  ],
  roadmap: [
    {
      id: 'future-highway',
      prompt: 'An endless futuristic highway stretching into the horizon, with each lane representing a different development track. Holographic milestone markers float above the road showing upcoming features. The road itself is made of flowing data streams. Vehicles representing completed features speed past, while upcoming features approach from the distance. Cyberpunk city skyline, neon sunset, Blade Runner aesthetic',
      style: 'cyberpunk, futuristic highway, neon',
      aspectRatio: '16:9',
      purpose: 'Roadmap header'
    },
    {
      id: 'voting-democracy',
      prompt: 'A massive digital amphitheater where thousands of user avatars cast glowing votes that float upward and merge into feature requests. The most voted features glow brighter and rise higher, forming constellation patterns. Democratic visualization, particle effects, community power, ethereal blue and gold color scheme',
      style: 'democratic visualization, particle effects, ethereal',
      aspectRatio: '16:9',
      purpose: 'Voting system visual'
    }
  ],
  consultation: [
    {
      id: 'expert-guidance',
      prompt: 'A warm, inviting modern office space with a business consultant and client having a productive meeting. Large windows show Brisbane city views. Digital whiteboards display strategy diagrams. Coffee on the table, authentic smiles, genuine engagement. Natural lighting, documentary photography style, authentic business moment, candid but professional',
      style: 'documentary, authentic, professional',
      aspectRatio: '16:9',
      purpose: 'Consultation hero'
    },
    {
      id: 'transformation-journey',
      prompt: 'Before and after split visualization: Left shows a stressed business owner drowning in paperwork and confused by complex dashboards. Right shows the same person confidently managing their business from a tablet while relaxing in a cafe. Dramatic transformation, storytelling through imagery, photojournalistic style',
      style: 'before/after, transformation, storytelling',
      aspectRatio: '16:9',
      purpose: 'Results visualization'
    }
  ]
};

interface AIImageGeneratorProps {
  page: string;
  onImageGenerated?: (imageUrl: string, prompt: ImagePrompt) => void;
}

export default function AIImageGenerator({ page, onImageGenerated }: AIImageGeneratorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<ImagePrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());
  
  const prompts = pageImagePrompts[page] || pageImagePrompts.homepage;

  const generateImage = async (prompt: ImagePrompt) => {
    setIsGenerating(true);
    setSelectedPrompt(prompt);
    
    // Simulate AI image generation
    setTimeout(() => {
      // In production, this would call an actual AI image generation API
      const mockImageUrl = `/generated/${prompt.id}.webp`;
      setGeneratedImages(prev => new Map(prev).set(prompt.id, mockImageUrl));
      setIsGenerating(false);
      
      if (onImageGenerated) {
        onImageGenerated(mockImageUrl, prompt);
      }
    }, 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI Image Generator
            </h2>
            <p className="text-gray-600">
              Generate stunning, unique images for your {page} page
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              Powered by Advanced AI
            </span>
          </div>
        </div>

        {/* Image Prompts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              {/* Image Preview Area */}
              <div className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center ${
                prompt.aspectRatio === '16:9' ? 'aspect-video' :
                prompt.aspectRatio === '1:1' ? 'aspect-square' :
                prompt.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                'aspect-[4/3]'
              }`}>
                {generatedImages.has(prompt.id) ? (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No image generated yet</p>
                  </div>
                )}
              </div>

              {/* Prompt Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {prompt.purpose}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {prompt.prompt}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {prompt.style.split(',')[0]}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {prompt.aspectRatio}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateImage(prompt)}
                    disabled={isGenerating && selectedPrompt?.id === prompt.id}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGenerating && selectedPrompt?.id === prompt.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </button>
                  
                  {generatedImages.has(prompt.id) && (
                    <>
                      <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Batch Actions */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">
            {generatedImages.size} of {prompts.length} images generated
          </p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
              Generate All
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
              Apply to Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}