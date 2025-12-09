/**
 * Security Settings Page
 *
 * Manages account security settings including:
 * - Two-factor authentication (MFA)
 * - Recovery codes management
 * - Session management
 * - Password changes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { MFASetup } from '@/components/auth/MFASetup';
import { getMFAStatus, unenrollMFA, generateRecoveryCodes } from '@/lib/auth/mfa';
import type { MFAStatus } from '@/lib/auth/mfa';
import { toast } from '@/lib/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SecuritySettingsPage() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disabling, setDisabling] = useState(false);

  // Load MFA status on mount
  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    setLoading(true);
    const status = await getMFAStatus();
    setMfaStatus(status);
    setLoading(false);
  };

  // Handle MFA setup success
  const handleSetupSuccess = () => {
    toast.success('Two-factor authentication enabled successfully');
    loadMFAStatus();
  };

  // Handle MFA disable
  const handleDisableMFA = async () => {
    if (!mfaStatus?.enrolledFactors[0]?.id) {
return;
}

    setDisabling(true);

    const result = await unenrollMFA(mfaStatus.enrolledFactors[0].id);

    if (result.success) {
      toast.success('Two-factor authentication disabled');
      setShowDisableDialog(false);
      loadMFAStatus();
    } else {
      toast.error(result.error || 'Failed to disable two-factor authentication');
    }

    setDisabling(false);
  };

  // Generate new recovery codes
  const handleGenerateRecoveryCodes = async () => {
    const result = await generateRecoveryCodes();

    if (result.success && result.codes) {
      setRecoveryCodes(result.codes);
      setShowRecoveryCodes(true);
      toast.success('New recovery codes generated');
    } else {
      toast.error(result.error || 'Failed to generate recovery codes');
    }
  };

  // Download recovery codes
  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) {
return;
}

    const codesText = [
      'Unite-Hub Two-Factor Authentication Recovery Codes',
      '='.repeat(50),
      '',
      'These codes can be used to access your account if you lose access',
      'to your authenticator app. Each code can only be used once.',
      '',
      'Keep these codes in a safe place!',
      '',
      ...recoveryCodes.map((code, i) => `${i + 1}. ${code}`),
      '',
      '='.repeat(50),
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n');

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unite-hub-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Recovery codes downloaded');
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mfaStatus?.enabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  {mfaStatus?.enabled
                    ? 'Your account is protected with two-factor authentication'
                    : 'Add an extra layer of security to your account'}
                </CardDescription>
              </div>
            </div>
            {mfaStatus?.enabled ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Secured
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="mr-1 h-3 w-3" />
                Basic
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!mfaStatus?.enabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account.
                We recommend enabling it to protect against unauthorized access.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Use an authenticator app to generate verification codes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* MFA Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {mfaStatus?.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {mfaStatus?.enabled ? 'Enabled' : 'Not enabled'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mfaStatus?.enabled
                        ? 'Two-factor authentication is active on your account'
                        : 'Set up two-factor authentication to secure your account'}
                    </p>
                  </div>
                </div>
                {mfaStatus?.enabled ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisableDialog(true)}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button onClick={() => setShowSetup(true)}>Enable</Button>
                )}
              </div>

              {/* Enrolled Factors */}
              {mfaStatus?.enabled && mfaStatus.enrolledFactors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Authenticator Apps</h4>
                    {mfaStatus.enrolledFactors.map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {factor.friendlyName || 'Authenticator App'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {factor.status === 'verified' ? 'Active' : 'Pending verification'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                          {factor.status === 'verified' ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recovery Codes */}
      {mfaStatus?.enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Recovery Codes</CardTitle>
                <CardDescription>
                  Use recovery codes to access your account if you lose your authenticator app
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each recovery code can only be used once. Generate new codes if you've used
                all of yours or lost access to them.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateRecoveryCodes}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Codes
              </Button>
            </div>

            {/* Recovery Codes Display */}
            {showRecoveryCodes && recoveryCodes.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {recoveryCodes.map((code, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span className="font-semibold">{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownloadRecoveryCodes}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Recovery Codes
                </Button>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Save these codes now! They won't be shown again. Each code can only be
                    used once.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MFA Setup Dialog */}
      <MFASetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onSuccess={handleSetupSuccess}
      />

      {/* Disable MFA Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. You will only need
              your password to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableMFA}
              disabled={disabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disabling ? 'Disabling...' : 'Disable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
