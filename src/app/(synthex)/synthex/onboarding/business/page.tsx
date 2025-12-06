'use client';

/**
 * Synthex Business Profile Onboarding Wizard
 * Phase B23: Multi-Business Tenant Onboarding & Profiles
 *
 * Multi-step wizard for setting up tenant profile:
 * Step 1: Basic Info - Business name, industry, region
 * Step 2: Branding - Timezone, domain, brand tone/voice
 * Step 3: Team - Invite team members
 * Step 4: Review - Summary and confirmation
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Globe,
  Users,
  Sparkles,
  AlertCircle,
  Mail,
  Trash2,
} from 'lucide-react';
import type {
  TenantProfileInput,
  TenantBrandTone,
  TenantRole,
} from '@/lib/synthex/tenantProfileService';

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingState {
  step: 1 | 2 | 3 | 4;
  basicInfo: {
    name: string;
    legal_name: string;
    industry: string;
    region: string;
  };
  branding: {
    timezone: string;
    default_domain: string;
    brand_tone: TenantBrandTone | '';
    brand_voice: string;
  };
  team: Array<{
    email: string;
    role: TenantRole;
  }>;
}

interface StepProps {
  state: OnboardingState;
  setState: (state: OnboardingState) => void;
  onNext: () => void;
  onPrev: () => void;
  loading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INDUSTRIES = [
  'trades',
  'restoration',
  'non_profit',
  'retail',
  'services',
  'education',
  'health',
  'other',
];

const REGIONS = [
  { value: 'au', label: 'Australia' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'eu', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'other', label: 'Other' },
];

const TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Asia/Tokyo',
];

const BRAND_TONES: TenantBrandTone[] = [
  'formal',
  'casual',
  'friendly',
  'professional',
  'playful',
  'authoritative',
  'conversational',
];

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function Step1BasicInfo({ state, setState, onNext, loading }: StepProps) {
  const isValid =
    state.basicInfo.name.trim() !== '' &&
    state.basicInfo.industry !== '' &&
    state.basicInfo.region !== '';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-accent-500" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Business Information
        </h2>
        <p className="text-text-secondary">
          Tell us about your business to get started
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            value={state.basicInfo.name}
            onChange={(e) =>
              setState({
                ...state,
                basicInfo: { ...state.basicInfo, name: e.target.value },
              })
            }
            placeholder="e.g., Acme Plumbing Services"
            className="bg-bg-card border-border text-text-primary"
          />
        </div>

        <div>
          <Label htmlFor="legal_name">Legal Name (Optional)</Label>
          <Input
            id="legal_name"
            value={state.basicInfo.legal_name}
            onChange={(e) =>
              setState({
                ...state,
                basicInfo: { ...state.basicInfo, legal_name: e.target.value },
              })
            }
            placeholder="e.g., Acme Plumbing Pty Ltd"
            className="bg-bg-card border-border text-text-primary"
          />
        </div>

        <div>
          <Label htmlFor="industry">Industry *</Label>
          <Select
            value={state.basicInfo.industry}
            onValueChange={(value) =>
              setState({
                ...state,
                basicInfo: { ...state.basicInfo, industry: value },
              })
            }
          >
            <SelectTrigger className="bg-bg-card border-border text-text-primary">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border">
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="region">Primary Region *</Label>
          <Select
            value={state.basicInfo.region}
            onValueChange={(value) =>
              setState({
                ...state,
                basicInfo: { ...state.basicInfo, region: value },
              })
            }
          >
            <SelectTrigger className="bg-bg-card border-border text-text-primary">
              <SelectValue placeholder="Select your region" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border">
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isValid || loading}
          className="bg-accent-500 hover:bg-accent-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Step2Branding({ state, setState, onNext, onPrev, loading }: StepProps) {
  const isValid =
    state.branding.timezone !== '' &&
    state.branding.brand_tone !== '';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent-500" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Brand Identity
        </h2>
        <p className="text-text-secondary">
          Help us understand your brand for AI-powered content
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="timezone">Timezone *</Label>
          <Select
            value={state.branding.timezone}
            onValueChange={(value) =>
              setState({
                ...state,
                branding: { ...state.branding, timezone: value },
              })
            }
          >
            <SelectTrigger className="bg-bg-card border-border text-text-primary">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default_domain">Website Domain (Optional)</Label>
          <Input
            id="default_domain"
            value={state.branding.default_domain}
            onChange={(e) =>
              setState({
                ...state,
                branding: { ...state.branding, default_domain: e.target.value },
              })
            }
            placeholder="e.g., acmeplumbing.com.au"
            className="bg-bg-card border-border text-text-primary"
          />
        </div>

        <div>
          <Label htmlFor="brand_tone">Brand Tone *</Label>
          <Select
            value={state.branding.brand_tone}
            onValueChange={(value) =>
              setState({
                ...state,
                branding: { ...state.branding, brand_tone: value as TenantBrandTone },
              })
            }
          >
            <SelectTrigger className="bg-bg-card border-border text-text-primary">
              <SelectValue placeholder="How should your brand sound?" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border">
              {BRAND_TONES.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-tertiary mt-1">
            This guides AI content generation to match your brand voice
          </p>
        </div>

        <div>
          <Label htmlFor="brand_voice">Brand Voice Description (Optional)</Label>
          <Textarea
            id="brand_voice"
            value={state.branding.brand_voice}
            onChange={(e) =>
              setState({
                ...state,
                branding: { ...state.branding, brand_voice: e.target.value },
              })
            }
            placeholder="e.g., Approachable and helpful, like a trusted local expert..."
            className="bg-bg-card border-border text-text-primary min-h-[100px]"
          />
          <p className="text-xs text-text-tertiary mt-1">
            More detail helps AI match your unique style
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onPrev}
          variant="outline"
          disabled={loading}
          className="border-border text-text-primary hover:bg-bg-card"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid || loading}
          className="bg-accent-500 hover:bg-accent-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Step3Team({ state, setState, onNext, onPrev, loading }: StepProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TenantRole>('viewer');

  const addTeamMember = () => {
    if (email.trim() === '' || !email.includes('@')) return;

    setState({
      ...state,
      team: [...state.team, { email: email.trim(), role }],
    });

    setEmail('');
    setRole('viewer');
  };

  const removeTeamMember = (index: number) => {
    setState({
      ...state,
      team: state.team.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Users className="w-12 h-12 mx-auto mb-4 text-accent-500" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Invite Your Team
        </h2>
        <p className="text-text-secondary">
          Add team members now or skip and invite them later
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTeamMember();
                }
              }}
              placeholder="colleague@example.com"
              className="bg-bg-card border-border text-text-primary"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as TenantRole)}>
              <SelectTrigger className="bg-bg-card border-border text-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-card border-border">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={addTeamMember}
              variant="outline"
              className="border-border text-text-primary hover:bg-bg-card"
            >
              <Mail className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {state.team.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-bg-card">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Team Members ({state.team.length})
            </h3>
            <div className="space-y-2">
              {state.team.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-primary">{member.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => removeTeamMember(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.team.length === 0 && (
          <Alert className="bg-gray-900 border-gray-800">
            <AlertCircle className="w-4 h-4 text-text-tertiary" />
            <AlertDescription className="text-text-secondary">
              No team members added yet. You can always invite them later from settings.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onPrev}
          variant="outline"
          disabled={loading}
          className="border-border text-text-primary hover:bg-bg-card"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={loading}
          className="bg-accent-500 hover:bg-accent-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Step4Review({ state, setState, onPrev, loading, onComplete }: StepProps & { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Review & Confirm
        </h2>
        <p className="text-text-secondary">
          Please review your information before completing setup
        </p>
      </div>

      <div className="space-y-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Business Name:</span>
              <span className="text-text-primary font-medium">{state.basicInfo.name}</span>
            </div>
            {state.basicInfo.legal_name && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Legal Name:</span>
                <span className="text-text-primary font-medium">{state.basicInfo.legal_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Industry:</span>
              <span className="text-text-primary font-medium">
                {state.basicInfo.industry.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Region:</span>
              <span className="text-text-primary font-medium">
                {REGIONS.find((r) => r.value === state.basicInfo.region)?.label}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-text-primary">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Timezone:</span>
              <span className="text-text-primary font-medium">{state.branding.timezone}</span>
            </div>
            {state.branding.default_domain && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Domain:</span>
                <span className="text-text-primary font-medium">{state.branding.default_domain}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Brand Tone:</span>
              <span className="text-text-primary font-medium">
                {state.branding.brand_tone.charAt(0).toUpperCase() + state.branding.brand_tone.slice(1)}
              </span>
            </div>
            {state.branding.brand_voice && (
              <div>
                <span className="text-text-secondary block mb-1">Brand Voice:</span>
                <p className="text-text-primary text-xs bg-gray-950 p-2 rounded border border-gray-800">
                  {state.branding.brand_voice}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {state.team.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary">
                Team Members ({state.team.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.team.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800"
                >
                  <span className="text-sm text-text-primary">{member.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onPrev}
          variant="outline"
          disabled={loading}
          className="border-border text-text-primary hover:bg-bg-card"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={loading}
          className="bg-accent-500 hover:bg-accent-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Completing Setup...
            </>
          ) : (
            <>
              Complete Setup
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id');

  const [state, setState] = useState<OnboardingState>({
    step: 1,
    basicInfo: {
      name: '',
      legal_name: '',
      industry: '',
      region: 'au',
    },
    branding: {
      timezone: 'Australia/Sydney',
      default_domain: '',
      brand_tone: '',
      brand_voice: '',
    },
    team: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user?.id || null);
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const nextStep = () => {
    if (state.step < 4) {
      setState({ ...state, step: (state.step + 1) as 1 | 2 | 3 | 4 });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      setState({ ...state, step: (state.step - 1) as 1 | 2 | 3 | 4 });
    }
  };

  const completeSetup = async () => {
    if (!tenantId || !userId) {
      setError('Missing tenant_id or user session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create/update tenant profile
      const profileData: TenantProfileInput = {
        name: state.basicInfo.name,
        legal_name: state.basicInfo.legal_name || undefined,
        industry: state.basicInfo.industry,
        region: state.basicInfo.region,
        timezone: state.branding.timezone,
        default_domain: state.branding.default_domain || undefined,
        brand_tone: state.branding.brand_tone as TenantBrandTone,
        brand_voice: state.branding.brand_voice || undefined,
      };

      const profileResponse = await fetch('/api/synthex/tenant/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, ...profileData }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      // 2. Invite team members
      for (const member of state.team) {
        const memberResponse = await fetch('/api/synthex/tenant/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            invited_email: member.email,
            role: member.role,
          }),
        });

        if (!memberResponse.ok) {
          console.error('Failed to invite member:', member.email);
        }
      }

      // 3. Redirect to dashboard
      router.push('/synthex/dashboard');
    } catch (err) {
      console.error('[BusinessOnboarding] Error completing setup:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Alert className="bg-gray-900 border-gray-800 max-w-md">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <AlertDescription className="text-text-secondary">
            Missing tenant_id parameter. Please access this page from the tenant setup flow.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    state.step >= step
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      state.step > step ? 'bg-accent-500' : 'bg-gray-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-text-tertiary">
            <span>Basic Info</span>
            <span>Branding</span>
            <span>Team</span>
            <span>Review</span>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/50 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main card */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            {state.step === 1 && (
              <Step1BasicInfo
                state={state}
                setState={setState}
                onNext={nextStep}
                onPrev={prevStep}
                loading={loading}
              />
            )}
            {state.step === 2 && (
              <Step2Branding
                state={state}
                setState={setState}
                onNext={nextStep}
                onPrev={prevStep}
                loading={loading}
              />
            )}
            {state.step === 3 && (
              <Step3Team
                state={state}
                setState={setState}
                onNext={nextStep}
                onPrev={prevStep}
                loading={loading}
              />
            )}
            {state.step === 4 && (
              <Step4Review
                state={state}
                setState={setState}
                onNext={nextStep}
                onPrev={prevStep}
                loading={loading}
                onComplete={completeSetup}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
