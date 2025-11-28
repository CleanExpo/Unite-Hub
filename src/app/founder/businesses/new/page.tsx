/**
 * New Business Registration Page
 *
 * Multi-step form wizard for adding a new business:
 * - Step 1: Business info (name, industry)
 * - Step 2: Links (website, social)
 * - Step 3: Initial signals/data
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

type Step = 1 | 2 | 3;

interface BusinessFormData {
  name: string;
  industry: string;
  description: string;
  website: string;
  linkedIn: string;
  facebook: string;
  instagram: string;
  twitter: string;
  initialNotes: string;
}

export default function NewBusinessPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    industry: '',
    description: '',
    website: '',
    linkedIn: '',
    facebook: '',
    instagram: '',
    twitter: '',
    initialNotes: '',
  });

  const updateField = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    // TODO: Submit to API
    console.log('Submitting business:', formData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect to business detail or list
    router.push('/founder/businesses');
  };

  const isStep1Valid = formData.name.trim() !== '' && formData.industry.trim() !== '';
  const isStep2Valid = true; // Links are optional
  const isStep3Valid = true; // Notes are optional

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep
                ? 'bg-blue-600 text-white'
                : step < currentStep
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-24 h-1 mx-2 ${
                step < currentStep ? 'bg-green-600' : 'bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-gray-300">
          Business Name *
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Balustrade Co."
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="industry" className="text-gray-300">
          Industry *
        </Label>
        <Input
          id="industry"
          type="text"
          value={formData.industry}
          onChange={(e) => updateField('industry', e.target.value)}
          placeholder="e.g., Construction, SaaS, Retail"
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-gray-300">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of your business..."
          rows={4}
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="website" className="text-gray-300 flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Website
        </Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => updateField('website', e.target.value)}
          placeholder="https://example.com"
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="linkedIn" className="text-gray-300 flex items-center">
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </Label>
        <Input
          id="linkedIn"
          type="url"
          value={formData.linkedIn}
          onChange={(e) => updateField('linkedIn', e.target.value)}
          placeholder="https://linkedin.com/company/..."
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="facebook" className="text-gray-300 flex items-center">
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Label>
        <Input
          id="facebook"
          type="url"
          value={formData.facebook}
          onChange={(e) => updateField('facebook', e.target.value)}
          placeholder="https://facebook.com/..."
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="instagram" className="text-gray-300 flex items-center">
          <Instagram className="w-4 h-4 mr-2" />
          Instagram
        </Label>
        <Input
          id="instagram"
          type="url"
          value={formData.instagram}
          onChange={(e) => updateField('instagram', e.target.value)}
          placeholder="https://instagram.com/..."
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="twitter" className="text-gray-300 flex items-center">
          <Twitter className="w-4 h-4 mr-2" />
          X (Twitter)
        </Label>
        <Input
          id="twitter"
          type="url"
          value={formData.twitter}
          onChange={(e) => updateField('twitter', e.target.value)}
          placeholder="https://x.com/..."
          className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="initialNotes" className="text-gray-300">
          Initial Notes & Signals
        </Label>
        <p className="text-sm text-gray-400 mt-1 mb-3">
          Add any initial context, goals, or signals you want to track for this business
        </p>
        <Textarea
          id="initialNotes"
          value={formData.initialNotes}
          onChange={(e) => updateField('initialNotes', e.target.value)}
          placeholder="e.g., Currently focusing on SEO optimization, launching new product line in Q2..."
          rows={8}
          className="bg-gray-900/50 border-gray-700 text-gray-100"
        />
      </div>

      <Card className="bg-blue-600/10 border-blue-500/30 p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• AI Phill will start monitoring your business signals</li>
          <li>• Health score will be calculated based on available data</li>
          <li>• You can add more details from the business dashboard</li>
          <li>• Insights and recommendations will appear automatically</li>
        </ul>
      </Card>
    </div>
  );

  return (
    <PageContainer>
      <Section>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-100">Add New Business</h1>
            <p className="text-gray-400 mt-2">
              Step {currentStep} of 3:{' '}
              {currentStep === 1
                ? 'Basic Information'
                : currentStep === 2
                ? 'Online Presence'
                : 'Initial Setup'}
            </p>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <Card className="bg-gray-800/50 border-gray-700 p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Create Business
                </Button>
              )}
            </div>
          </Card>

          {/* Cancel button */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/founder/businesses')}
              className="text-gray-400 hover:text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}
