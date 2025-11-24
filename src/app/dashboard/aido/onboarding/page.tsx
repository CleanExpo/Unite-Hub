'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Loader2,
  User,
  Building2,
  Users,
  ExternalLink,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function AIDOOnboardingPage() {
  const { currentOrganization } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [services, setServices] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2: Authority Figure
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [credentials, setCredentials] = useState('');
  const [previousWork, setPreviousWork] = useState('');
  const [education, setEducation] = useState('');

  // Step 3: OAuth Integrations (optional)
  const [gscConnected, setGscConnected] = useState(false);
  const [gbpConnected, setGbpConnected] = useState(false);
  const [ga4Connected, setGa4Connected] = useState(false);

  // Check for OAuth success redirects
  useEffect(() => {
    if (searchParams.get('gsc_connected') === 'true') {
      setGscConnected(true);
      const step = searchParams.get('step');
      if (step) setCurrentStep(parseInt(step));
    }
    if (searchParams.get('gbp_connected') === 'true') {
      setGbpConnected(true);
      const step = searchParams.get('step');
      if (step) setCurrentStep(parseInt(step));
    }
    if (searchParams.get('ga4_connected') === 'true') {
      setGa4Connected(true);
      const step = searchParams.get('step');
      if (step) setCurrentStep(parseInt(step));
    }
  }, [searchParams]);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Business Profile',
      description: 'Tell us about your business',
      completed: currentStep > 1,
    },
    {
      id: 2,
      title: 'Authority Figure',
      description: 'Who is the expert behind the business?',
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: 'Data Integrations (Optional)',
      description: 'Connect your Google accounts for better insights',
      completed: currentStep > 3,
    },
  ];

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleGenerateIntelligence();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep1 = (): boolean => {
    if (!businessName || !industry || !services || !yearsInBusiness || !location) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!fullName || !role || !yearsExperience) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleGenerateIntelligence = async () => {
    setGenerating(true);
    try {
      const session = await (await import('@/lib/supabase')).supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id,
      });

      const response = await fetch(`/api/aido/onboarding/generate?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessInput: {
            businessName,
            industry,
            services: services.split(',').map(s => s.trim()),
            yearsInBusiness: parseInt(yearsInBusiness),
            location,
            website: website || undefined,
          },
          authorityInput: {
            fullName,
            role,
            yearsExperience: parseInt(yearsExperience),
            linkedinUrl: linkedinUrl || undefined,
            facebookUrl: facebookUrl || undefined,
            credentials: credentials ? credentials.split(',').map(c => c.trim()) : undefined,
            previousWork: previousWork ? previousWork.split(',').map(p => p.trim()) : undefined,
            education: education ? education.split(',').map(e => e.trim()) : undefined,
          },
          // TODO: Add actual GSC, GBP, GA4 data when OAuth is implemented
          gscData: undefined,
          gbpData: undefined,
          ga4Data: undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Onboarding complete! Generated:\n` +
            `- Business Profile: ${data.summary.businessProfile.name}\n` +
            `- Authority Figure: ${data.summary.authorityFigure.name}\n` +
            `- Audience Personas: ${data.summary.personas}\n` +
            `- Content Pillars: ${data.summary.contentPillars}\n\n` +
            `Cost: ${data.generation.estimatedCost}\n` +
            `Duration: ${data.generation.duration}`
        );

        // Redirect to AIDO overview
        router.push('/dashboard/aido/overview');
      } else {
        alert(data.error || 'Failed to generate onboarding intelligence');
      }
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
      alert('Failed to generate onboarding intelligence');
    } finally {
      setGenerating(false);
    }
  };

  const connectGoogleSearchConsole = async () => {
    if (!currentOrganization?.org_id) {
      alert('No workspace selected. Please try again.');
      return;
    }

    try {
      const { getGSCAuthUrl } = await import('@/lib/integrations/google-search-console');
      const authUrl = getGSCAuthUrl(currentOrganization.org_id);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to generate GSC auth URL:', error);
      alert('Failed to initiate Google Search Console OAuth. Please try again.');
    }
  };

  const connectGoogleBusinessProfile = async () => {
    if (!currentOrganization?.org_id) {
      alert('No workspace selected. Please try again.');
      return;
    }

    try {
      const { getGBPAuthUrl } = await import('@/lib/integrations/google-business-profile');
      const authUrl = getGBPAuthUrl(currentOrganization.org_id);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to generate GBP auth URL:', error);
      alert('Failed to initiate Google Business Profile OAuth. Please try again.');
    }
  };

  const connectGoogleAnalytics = async () => {
    if (!currentOrganization?.org_id) {
      alert('No workspace selected. Please try again.');
      return;
    }

    try {
      const { getGA4AuthUrl } = await import('@/lib/integrations/google-analytics-4');
      const authUrl = getGA4AuthUrl(currentOrganization.org_id);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to generate GA4 auth URL:', error);
      alert('Failed to initiate Google Analytics 4 OAuth. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AIDO Client Onboarding</h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered discovery to understand your business, expertise, and audience
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    step.completed
                      ? 'bg-green-600 border-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      currentStep === step.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{step.description}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Building2 className="w-5 h-5" />}
            {currentStep === 2 && <User className="w-5 h-5" />}
            {currentStep === 3 && <Users className="w-5 h-5" />}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Business Profile */}
          {currentStep === 1 && (
            <>
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Unite Balustrades"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Construction, Manufacturing"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    placeholder="e.g., 15"
                    value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="services">Services (comma-separated) *</Label>
                <Textarea
                  id="services"
                  placeholder="e.g., Stainless steel balustrades, Glass railings, Handrail installation"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  List your core services separated by commas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Brisbane, Australia"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    placeholder="e.g., https://unite-group.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What we'll generate:</strong> Business tagline, unique value
                  proposition, expertise areas, competitive differentiators, and core service
                  descriptions.
                </p>
              </div>
            </>
          )}

          {/* Step 2: Authority Figure */}
          {currentStep === 2 && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      E-E-A-T Verification Required
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Google requires verifiable author credentials. LinkedIn and Facebook profiles
                      help establish expertise, authoritativeness, and trustworthiness.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., CEO, Founder, Technical Director"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Experience *</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="e.g., 20"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                  <div className="relative">
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                    <ExternalLink className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="facebookUrl">Facebook Profile URL</Label>
                  <div className="relative">
                    <Input
                      id="facebookUrl"
                      placeholder="https://facebook.com/yourprofile"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                    <ExternalLink className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="credentials">Credentials & Certifications (comma-separated)</Label>
                <Textarea
                  id="credentials"
                  placeholder="e.g., Licensed Builder, AS1170 Certified, QBCC License #12345"
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="previousWork">Notable Projects/Work (comma-separated)</Label>
                <Textarea
                  id="previousWork"
                  placeholder="e.g., Brisbane Airport Terminal, Queen Street Mall renovations"
                  value={previousWork}
                  onChange={(e) => setPreviousWork(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="education">Education (comma-separated)</Label>
                <Textarea
                  id="education"
                  placeholder="e.g., Bachelor of Engineering (Civil), QUT"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What we'll generate:</strong> Professional bio (150-200 words), short
                  byline (50-75 words), comprehensive About page (300-400 words), expertise areas,
                  and notable achievements.
                </p>
              </div>
            </>
          )}

          {/* Step 3: Data Integrations */}
          {currentStep === 3 && (
            <>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                      Optional: Connect for Better Insights
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      Connecting your Google accounts allows AI to analyze real customer search
                      behavior, questions, and demographics for more accurate audience personas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Google Search Console */}
                <Card className={gscConnected ? 'border-green-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Google Search Console</h3>
                          {gscConnected && (
                            <Badge className="bg-green-100 text-green-800">Connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          See what your customers are actually searching for
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Top 100 search queries</li>
                          <li>• Click-through rates</li>
                          <li>• Impression data</li>
                        </ul>
                      </div>
                      <Button
                        variant={gscConnected ? 'outline' : 'default'}
                        onClick={connectGoogleSearchConsole}
                        disabled={gscConnected}
                      >
                        {gscConnected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Business Profile */}
                <Card className={gbpConnected ? 'border-green-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Google Business Profile</h3>
                          {gbpConnected && (
                            <Badge className="bg-green-100 text-green-800">Connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Understand local search behavior and customer questions
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Customer questions</li>
                          <li>• Review insights</li>
                          <li>• Search query data</li>
                        </ul>
                      </div>
                      <Button
                        variant={gbpConnected ? 'outline' : 'default'}
                        onClick={connectGoogleBusinessProfile}
                        disabled={gbpConnected}
                      >
                        {gbpConnected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Analytics 4 */}
                <Card className={ga4Connected ? 'border-green-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Google Analytics 4</h3>
                          {ga4Connected && (
                            <Badge className="bg-green-100 text-green-800">Connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Learn who your audience is and what they care about
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Demographics (age, location)</li>
                          <li>• Top pages and content</li>
                          <li>• User behavior patterns</li>
                        </ul>
                      </div>
                      <Button
                        variant={ga4Connected ? 'outline' : 'default'}
                        onClick={connectGoogleAnalytics}
                        disabled={ga4Connected}
                      >
                        {ga4Connected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What we'll generate:</strong> 3-5 audience personas based on real
                  customer data, content strategy with topic pillars, and H2-ready questions users
                  actually ask.
                </p>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={generating}>
              {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentStep === 3
                ? generating
                  ? 'Generating...'
                  : 'Generate Intelligence (~$2.00)'
                : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
