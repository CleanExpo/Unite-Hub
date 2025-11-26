'use client';

/**
 * Synthex Onboarding Flow
 *
 * Multi-step onboarding experience for new SMB customers:
 * Step 1: Business Profile - Industry, region, website
 * Step 2: Plan Selection - Launch/Growth/Scale with offer display
 * Step 3: Brand Setup - Name, domain, positioning
 * Step 4: Confirmation - Review and activate subscription
 *
 * Features:
 * - Automatic offer tier detection and badge display
 * - Industry presets (8 industries)
 * - Pricing calculator with discount visualization
 * - Progress tracking
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import pricing engine
import {
  PLANS,
  calculateEffectivePrice,
  getCurrentOfferTier,
  getOfferBanner,
  getAllIndustries,
} from '@/lib/synthex/synthexOfferEngine';

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingState {
  step: 1 | 2 | 3 | 4;
  businessProfile: {
    businessName: string;
    industry: string;
    region: string;
    websiteUrl?: string;
  };
  selectedPlan?: string;
  selectedOfferTier?: string;
  brandSetup: {
    brandName: string;
    primaryDomain: string;
    tagline: string;
    valueProposition: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SynthexOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    businessProfile: {
      businessName: '',
      industry: '',
      region: '',
      websiteUrl: '',
    },
    brandSetup: {
      brandName: '',
      primaryDomain: '',
      tagline: '',
      valueProposition: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerBanner, setOfferBanner] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user and offer tier
  useEffect(() => {
    const fetchUserAndOffer = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setCurrentUser(user);

        // Get current offer tier
        const banner = getOfferBanner();
        setOfferBanner(banner);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUserAndOffer();
  }, [router]);

  // ============================================================================
  // STEP 1: BUSINESS PROFILE
  // ============================================================================

  const handleBusinessProfileChange = (field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      businessProfile: {
        ...prev.businessProfile,
        [field]: value,
      },
    }));
    setError(null);
  };

  const validateBusinessProfile = (): boolean => {
    if (
      !state.businessProfile.businessName ||
      !state.businessProfile.industry ||
      !state.businessProfile.region
    ) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const proceedToStep2 = () => {
    if (validateBusinessProfile()) {
      setState((prev) => ({ ...prev, step: 2 }));
    }
  };

  // ============================================================================
  // STEP 2: PLAN SELECTION
  // ============================================================================

  const handlePlanSelect = (planCode: string) => {
    setState((prev) => ({ ...prev, selectedPlan: planCode }));
    setError(null);
  };

  const getPlanPrice = (planCode: string): string => {
    if (!offerBanner) return `$${PLANS[planCode as keyof typeof PLANS].priceAud}/mo`;

    const effectivePrice = calculateEffectivePrice(planCode, offerBanner.tier);
    return `$${effectivePrice.toFixed(2)}/mo`;
  };

  const proceedToStep3 = () => {
    if (!state.selectedPlan) {
      setError('Please select a plan');
      return;
    }
    setState((prev) => ({ ...prev, step: 3 }));
  };

  // ============================================================================
  // STEP 3: BRAND SETUP
  // ============================================================================

  const handleBrandChange = (field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      brandSetup: {
        ...prev.brandSetup,
        [field]: value,
      },
    }));
    setError(null);
  };

  const validateBrandSetup = (): boolean => {
    if (
      !state.brandSetup.brandName ||
      !state.brandSetup.primaryDomain ||
      !state.brandSetup.tagline
    ) {
      setError('Please fill in all required fields');
      return false;
    }

    // Basic domain validation
    if (!state.brandSetup.primaryDomain.includes('.')) {
      setError('Please enter a valid domain (e.g., example.com)');
      return false;
    }

    return true;
  };

  const proceedToStep4 = () => {
    if (validateBrandSetup()) {
      setState((prev) => ({ ...prev, step: 4 }));
    }
  };

  // ============================================================================
  // STEP 4: CONFIRMATION & CREATE TENANT
  // ============================================================================

  const handleConfirmAndCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call API to create tenant, subscription, and brand
      const response = await fetch('/api/synthex/tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          businessName: state.businessProfile.businessName,
          industry: state.businessProfile.industry,
          region: state.businessProfile.region,
          websiteUrl: state.businessProfile.websiteUrl,
          planCode: state.selectedPlan,
          offerTier: offerBanner?.tier || 'standard',
          brandName: state.brandSetup.brandName,
          primaryDomain: state.brandSetup.primaryDomain,
          tagline: state.brandSetup.tagline,
          valueProposition: state.brandSetup.valueProposition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const { tenant, subscription } = await response.json();

      // Redirect to dashboard with tenantId
      router.push(`/synthex/dashboard?tenantId=${tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome to Synthex</h1>
          <p className="text-lg text-slate-600">
            Set up your account in 4 simple steps. Step {state.step} of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step < state.step
                      ? 'bg-green-500 text-white'
                      : step === state.step
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {step < state.step ? <CheckCircle size={20} /> : step}
                </div>
                {step < 4 && <div className="w-8 h-0.5 bg-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Offer Banner (if applicable) */}
        {offerBanner && offerBanner.isActive && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <Badge className="bg-green-600">{offerBanner.discountPercentage}% OFF</Badge>
                    {offerBanner.offerName}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {offerBanner.slotsRemaining > 0
                      ? `Only ${offerBanner.slotsRemaining} slots remaining!`
                      : 'Offer limited to early adopters'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 1: Business Profile */}
        {state.step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                We'll customize Synthex based on your industry and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-base font-semibold">
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g., ABC Plumbing"
                  value={state.businessProfile.businessName}
                  onChange={(e) => handleBusinessProfileChange('businessName', e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-base font-semibold">
                  Industry *
                </Label>
                <Select
                  value={state.businessProfile.industry}
                  onValueChange={(value) => handleBusinessProfileChange('industry', value)}
                >
                  <SelectTrigger id="industry" className="h-10">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllIndustries().map((ind) => (
                      <SelectItem key={ind.industry} value={ind.industry}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region" className="text-base font-semibold">
                  Region *
                </Label>
                <Select
                  value={state.businessProfile.region}
                  onValueChange={(value) => handleBusinessProfileChange('region', value)}
                >
                  <SelectTrigger id="region" className="h-10">
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="eu">Europe</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Website URL (optional) */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-base font-semibold">
                  Website (optional)
                </Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={state.businessProfile.websiteUrl || ''}
                  onChange={(e) => handleBusinessProfileChange('websiteUrl', e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-end pt-4">
                <Button onClick={proceedToStep2} className="gap-2">
                  Next Step <ChevronRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Plan Selection */}
        {state.step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose your plan</CardTitle>
              <CardDescription>
                All plans include AI-powered content generation, email automation, and SEO
                optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(PLANS).map(([code, plan]) => {
                  const isSelected = state.selectedPlan === code;
                  const effectivePrice = calculateEffectivePrice(
                    code,
                    offerBanner?.tier || 'standard'
                  );
                  const discount = plan.priceAud - effectivePrice;

                  return (
                    <Card
                      key={code}
                      className={`relative cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-blue-500 shadow-lg'
                          : 'hover:shadow-md border-slate-200'
                      }`}
                      onClick={() => handlePlanSelect(code)}
                    >
                      {plan.popular && (
                        <Badge className="absolute top-3 right-3 bg-blue-600">Most Popular</Badge>
                      )}

                      <CardHeader>
                        <CardTitle className="text-2xl">{plan.label}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Price */}
                        <div>
                          <div className="text-4xl font-bold text-slate-900">
                            ${effectivePrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600">/month AUD</div>

                          {discount > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="text-red-600 line-through">
                                ${plan.priceAud.toFixed(2)}
                              </span>
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Save ${discount.toFixed(2)}/mo
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>{plan.brands} brands</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Up to {plan.jobsPerMonth} jobs/month</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>AI content generation</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Email automation</span>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <RadioGroup value={code}>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value={code} id={code} />
                              <Label htmlFor={code} className="text-sm cursor-pointer">
                                Selected
                              </Label>
                            </div>
                          </RadioGroup>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setState((prev) => ({ ...prev, step: 1 }))}
                >
                  Back
                </Button>
                <Button onClick={proceedToStep3} className="gap-2">
                  Next Step <ChevronRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Brand Setup */}
        {state.step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Set up your brand</CardTitle>
              <CardDescription>
                Customize how Synthex presents your business across all channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-base font-semibold">
                  Brand Name *
                </Label>
                <Input
                  id="brandName"
                  placeholder="e.g., ABC Plumbing"
                  value={state.brandSetup.brandName}
                  onChange={(e) => handleBrandChange('brandName', e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Primary Domain */}
              <div className="space-y-2">
                <Label htmlFor="primaryDomain" className="text-base font-semibold">
                  Primary Domain *
                </Label>
                <Input
                  id="primaryDomain"
                  placeholder="e.g., example.com"
                  value={state.brandSetup.primaryDomain}
                  onChange={(e) => handleBrandChange('primaryDomain', e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-base font-semibold">
                  Tagline *
                </Label>
                <Input
                  id="tagline"
                  placeholder="e.g., Professional plumbing services you can trust"
                  value={state.brandSetup.tagline}
                  onChange={(e) => handleBrandChange('tagline', e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Value Proposition */}
              <div className="space-y-2">
                <Label htmlFor="valueProposition" className="text-base font-semibold">
                  What makes your business unique? (optional)
                </Label>
                <textarea
                  id="valueProposition"
                  placeholder="e.g., 24/7 emergency service, licensed professionals, same-day service"
                  value={state.brandSetup.valueProposition}
                  onChange={(e) => handleBrandChange('valueProposition', e.target.value)}
                  className="min-h-24 p-3 border border-slate-200 rounded-md"
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setState((prev) => ({ ...prev, step: 2 }))}
                >
                  Back
                </Button>
                <Button onClick={proceedToStep4} className="gap-2">
                  Review & Activate <ChevronRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Confirmation */}
        {state.step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and activate your account</CardTitle>
              <CardDescription>
                Please confirm the details below before we create your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Profile Summary */}
              <div className="border-b pb-6">
                <h3 className="font-semibold text-lg mb-4">Business Profile</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Business Name</div>
                    <div className="font-medium">{state.businessProfile.businessName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Industry</div>
                    <div className="font-medium">
                      {INDUSTRIES.find((i) => i.code === state.businessProfile.industry)?.label}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Region</div>
                    <div className="font-medium capitalize">{state.businessProfile.region}</div>
                  </div>
                  {state.businessProfile.websiteUrl && (
                    <div>
                      <div className="text-sm text-slate-600">Website</div>
                      <div className="font-medium">{state.businessProfile.websiteUrl}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Summary */}
              <div className="border-b pb-6">
                <h3 className="font-semibold text-lg mb-4">Selected Plan</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Plan</div>
                    <div className="font-medium text-lg">
                      {PLANS[state.selectedPlan as keyof typeof PLANS].label}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Monthly Price</div>
                    <div className="font-medium text-lg">{getPlanPrice(state.selectedPlan!)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Brands</div>
                    <div className="font-medium">
                      {PLANS[state.selectedPlan as keyof typeof PLANS].brands}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Jobs per Month</div>
                    <div className="font-medium">
                      {PLANS[state.selectedPlan as keyof typeof PLANS].jobsPerMonth}
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Brand Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Brand Name</div>
                    <div className="font-medium">{state.brandSetup.brandName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Primary Domain</div>
                    <div className="font-medium">{state.brandSetup.primaryDomain}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-slate-600">Tagline</div>
                    <div className="font-medium">{state.brandSetup.tagline}</div>
                  </div>
                  {state.brandSetup.valueProposition && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-slate-600">Value Proposition</div>
                      <div className="font-medium">{state.brandSetup.valueProposition}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">
                  By clicking "Activate Account", you agree to our Terms of Service and will be
                  charged{' '}
                  <strong>{getPlanPrice(state.selectedPlan!)}</strong> per month starting today.
                  You can cancel anytime.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setState((prev) => ({ ...prev, step: 3 }))}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmAndCreate}
                  disabled={loading}
                  className="gap-2 min-w-[180px]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Activate Account <ChevronRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
