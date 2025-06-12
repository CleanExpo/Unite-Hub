'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Shield, Download, Trash2 } from 'lucide-react';

interface UserPrivacySettings {
  id: string;
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  dataProcessingPreferences: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };
}

interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

interface DataDeletionRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  type: 'partial' | 'full';
}

interface PrivacyState {
  loading: boolean;
  privacySettings: UserPrivacySettings | null;
  exportRequests: DataExportRequest[];
  deletionRequests: DataDeletionRequest[];
  submitting: boolean;
  error: string | null;
  success: string | null;
}

export default function PrivacyPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [state, setState] = useState<PrivacyState>({
    loading: true,
    privacySettings: null,
    exportRequests: [],
    deletionRequests: [],
    submitting: false,
    error: null,
    success: null,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setSession(session);

        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch privacy settings
        const response = await fetch('/api/compliance/privacy-settings');
        if (!response.ok) {
          throw new Error('Failed to fetch privacy data');
        }

        const data = await response.json();
        setState(prevState => ({
          ...prevState,
          loading: false,
          privacySettings: data.settings,
          exportRequests: data.exportRequests || [],
          deletionRequests: data.deletionRequests || [],
        }));
      } catch (error: any) {
        console.error('Failed to fetch user data:', error);
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: 'Failed to load privacy settings',
        }));
      }
    };

    fetchUserData();
  }, [router]);

  const handleCommunicationPreferenceChange = (
    key: keyof UserPrivacySettings['communicationPreferences'],
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!state.privacySettings) return;

    setState(prevState => ({
      ...prevState,
      privacySettings: {
        ...prevState.privacySettings!,
        communicationPreferences: {
          ...prevState.privacySettings!.communicationPreferences,
          [key]: event.target.checked
        }
      }
    }));
  };

  const handleDataProcessingPreferenceChange = (
    key: keyof UserPrivacySettings['dataProcessingPreferences'],
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!state.privacySettings) return;

    setState(prevState => ({
      ...prevState,
      privacySettings: {
        ...prevState.privacySettings!,
        dataProcessingPreferences: {
          ...prevState.privacySettings!.dataProcessingPreferences,
          [key]: event.target.checked
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    if (!state.privacySettings) return;

    setState(prevState => ({ ...prevState, submitting: true, error: null, success: null }));

    try {
      const response = await fetch('/api/compliance/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          communicationPreferences: state.privacySettings.communicationPreferences,
          dataProcessingPreferences: state.privacySettings.dataProcessingPreferences,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update settings');
      }

      setState(prevState => ({
        ...prevState,
        submitting: false,
        success: 'Privacy settings updated successfully',
      }));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setState(prevState => ({ ...prevState, success: null }));
      }, 5000);
    } catch (error: any) {
      console.error('Failed to update privacy settings:', error);
      setState(prevState => ({
        ...prevState,
        submitting: false,
        error: error.message || 'Failed to update settings',
      }));
    }
  };

  const handleRequestDataExport = async () => {
    setState(prevState => ({ ...prevState, submitting: true, error: null, success: null }));

    try {
      const response = await fetch('/api/compliance/data-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exportFormat: 'json',
          categories: ['all'],
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to request data export');
      }

      const newRequest = await response.json();
      setState(prevState => ({
        ...prevState,
        submitting: false,
        success: 'Data export request submitted successfully',
        exportRequests: [newRequest, ...prevState.exportRequests],
      }));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setState(prevState => ({ ...prevState, success: null }));
      }, 5000);
    } catch (error: any) {
      console.error('Failed to request data export:', error);
      setState(prevState => ({
        ...prevState,
        submitting: false,
        error: error.message || 'Failed to request data export',
      }));
    }
  };

  const handleRequestDataDeletion = async (type: 'partial' | 'full') => {
    setState(prevState => ({ ...prevState, submitting: true, error: null, success: null }));

    try {
      const response = await fetch('/api/compliance/data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestType: type,
          categories: type === 'partial' ? ['analytics', 'marketing'] : ['all'],
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to request data deletion');
      }

      const newRequest = await response.json();
      setState(prevState => ({
        ...prevState,
        submitting: false,
        success: 'Data deletion request submitted successfully',
        deletionRequests: [newRequest, ...prevState.deletionRequests],
      }));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setState(prevState => ({ ...prevState, success: null }));
      }, 5000);
    } catch (error: any) {
      console.error('Failed to request data deletion:', error);
      setState(prevState => ({
        ...prevState,
        submitting: false,
        error: error.message || 'Failed to request data deletion',
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading privacy settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Privacy Settings</h1>

        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.success && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
            <CardDescription>
              Choose how you want to receive communications from us
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-comm">Email Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates and notifications via email
                  </p>
                </div>
                <Switch
                  id="email-comm"
                  checked={state.privacySettings?.communicationPreferences.email || false}
                  onCheckedChange={(checked) => 
                    handleCommunicationPreferenceChange('email', { target: { checked } } as any)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-comm">SMS Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via SMS
                  </p>
                </div>
                <Switch
                  id="sms-comm"
                  checked={state.privacySettings?.communicationPreferences.sms || false}
                  onCheckedChange={(checked) => 
                    handleCommunicationPreferenceChange('sms', { target: { checked } } as any)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-comm">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  id="push-comm"
                  checked={state.privacySettings?.communicationPreferences.push || false}
                  onCheckedChange={(checked) => 
                    handleCommunicationPreferenceChange('push', { target: { checked } } as any)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={state.submitting}>
                {state.submitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Processing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Data Processing Preferences</CardTitle>
            <CardDescription>
              Control how your data is used for various purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics-data">Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow us to analyze your usage to improve our services
                  </p>
                </div>
                <Switch
                  id="analytics-data"
                  checked={state.privacySettings?.dataProcessingPreferences.analytics || false}
                  onCheckedChange={(checked) => 
                    handleDataProcessingPreferenceChange('analytics', { target: { checked } } as any)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-data">Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Use your data to personalize marketing content
                  </p>
                </div>
                <Switch
                  id="marketing-data"
                  checked={state.privacySettings?.dataProcessingPreferences.marketing || false}
                  onCheckedChange={(checked) => 
                    handleDataProcessingPreferenceChange('marketing', { target: { checked } } as any)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="personalization-data">Personalization</Label>
                  <p className="text-sm text-muted-foreground">
                    Personalize your experience based on your preferences
                  </p>
                </div>
                <Switch
                  id="personalization-data"
                  checked={state.privacySettings?.dataProcessingPreferences.personalization || false}
                  onCheckedChange={(checked) => 
                    handleDataProcessingPreferenceChange('personalization', { target: { checked } } as any)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={state.submitting}>
                {state.submitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>
              Request a copy of your personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can request a copy of all personal data we have about you. 
                This will be provided in a machine-readable format.
              </p>
              
              <Button 
                onClick={handleRequestDataExport} 
                disabled={state.submitting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {state.submitting ? 'Processing...' : 'Request Data Export'}
              </Button>

              {state.exportRequests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Export Requests</h4>
                  <div className="space-y-2">
                    {state.exportRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Status: {request.status}</p>
                        </div>
                        {request.downloadUrl && (
                          <Button size="sm" asChild>
                            <a href={request.downloadUrl} download>Download</a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Data Deletion</CardTitle>
            <CardDescription>
              Request deletion of your personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Data deletion is permanent and cannot be undone. Please consider exporting your data first.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => handleRequestDataDeletion('partial')} 
                  disabled={state.submitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Marketing Data
                </Button>

                <Button 
                  variant="destructive"
                  onClick={() => handleRequestDataDeletion('full')} 
                  disabled={state.submitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>

              {state.deletionRequests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Deletion Requests</h4>
                  <div className="space-y-2">
                    {state.deletionRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {request.type} | Status: {request.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
