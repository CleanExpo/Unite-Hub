'use client';

import { Variant, MultiVariant } from '@/components/experiments/Variant';
import { useExperiment } from '@/hooks/useExperiment';
import { Button } from '@/components/ui/button';

/**
 * Example component demonstrating A/B testing usage
 */
export function ABTestExample() {
  // Method 1: Using the useExperiment hook directly
  const { variant, track } = useExperiment('Homepage CTA Test');

  const handleCTAClick = () => {
    // Track conversion event
    track('cta_clicked', { 
      location: 'hero_section',
      timestamp: new Date().toISOString() 
    });
  };

  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">A/B Testing Examples</h2>

      {/* Method 1: Using hook directly */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Method 1: Using useExperiment hook</h3>
        {variant === 'control' && (
          <Button onClick={handleCTAClick} variant="default">
            Get Started
          </Button>
        )}
        {variant === 'green-button' && (
          <Button onClick={handleCTAClick} className="bg-green-600 hover:bg-green-700">
            Get Started Now
          </Button>
        )}
        {variant === 'red-button' && (
          <Button onClick={handleCTAClick} className="bg-red-600 hover:bg-red-700">
            Start Free Trial
          </Button>
        )}
      </div>

      {/* Method 2: Using Variant component */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Method 2: Using Variant component</h3>
        
        <Variant experiment="Homepage CTA Test" variant="control">
          <Button onClick={handleCTAClick} variant="default">
            Get Started
          </Button>
        </Variant>

        <Variant experiment="Homepage CTA Test" variant="green-button">
          <Button onClick={handleCTAClick} className="bg-green-600 hover:bg-green-700">
            Get Started Now
          </Button>
        </Variant>

        <Variant experiment="Homepage CTA Test" variant="red-button">
          <Button onClick={handleCTAClick} className="bg-red-600 hover:bg-red-700">
            Start Free Trial
          </Button>
        </Variant>
      </div>

      {/* Method 3: Using MultiVariant component */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Method 3: Using MultiVariant component</h3>
        
        <MultiVariant experiment="Homepage CTA Test">
          <Button 
            data-variant="control" 
            onClick={handleCTAClick} 
            variant="default"
          >
            Get Started
          </Button>
          <Button 
            data-variant="green-button" 
            onClick={handleCTAClick} 
            className="bg-green-600 hover:bg-green-700"
          >
            Get Started Now
          </Button>
          <Button 
            data-variant="red-button" 
            onClick={handleCTAClick} 
            className="bg-red-600 hover:bg-red-700"
          >
            Start Free Trial
          </Button>
        </MultiVariant>
      </div>

      {/* Example with tracking view events */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example with automatic view tracking</h3>
        
        <Variant 
          experiment="Pricing Page Layout" 
          variant="grid" 
          trackView={true}
          viewEventName="pricing_layout_viewed"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="border p-4 rounded">Plan A</div>
            <div className="border p-4 rounded">Plan B</div>
            <div className="border p-4 rounded">Plan C</div>
          </div>
        </Variant>

        <Variant 
          experiment="Pricing Page Layout" 
          variant="list" 
          trackView={true}
          viewEventName="pricing_layout_viewed"
        >
          <div className="space-y-4">
            <div className="border p-4 rounded">Plan A</div>
            <div className="border p-4 rounded">Plan B</div>
            <div className="border p-4 rounded">Plan C</div>
          </div>
        </Variant>
      </div>
    </div>
  );
}

/**
 * Real-world example: Hero section with A/B tested CTA
 */
export function HeroSectionWithABTest() {
  const { variant, track } = useExperiment('Homepage CTA Test');

  const handleCTAClick = () => {
    track('hero_cta_clicked');
    // Navigate to sign up or perform action
  };

  const handleSecondaryClick = () => {
    track('hero_secondary_clicked');
    // Navigate to learn more
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">
          Transform Your Business Today
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of companies using our platform to grow faster
        </p>

        <div className="flex gap-4 justify-center">
          <MultiVariant experiment="Homepage CTA Test">
            <Button 
              data-variant="control"
              onClick={handleCTAClick}
              size="lg"
            >
              Get Started
            </Button>
            
            <Button 
              data-variant="green-button"
              onClick={handleCTAClick}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Get Started Now
            </Button>
            
            <Button 
              data-variant="red-button"
              onClick={handleCTAClick}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Start Free Trial
            </Button>
          </MultiVariant>

          <Button 
            variant="outline" 
            size="lg"
            onClick={handleSecondaryClick}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
