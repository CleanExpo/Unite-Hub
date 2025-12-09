/**
 * MFA Setup Component
 *
 * Displays QR code for authenticator app setup and handles enrollment verification.
 * Shows recovery codes after successful enrollment (one-time view).
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Copy,
  Check,
  AlertCircle,
  Download,
  Smartphone,
  Key,
} from 'lucide-react';
import { enrollMFA, verifyMFAEnrollment } from '@/lib/auth/mfa';
import { toast } from '@/lib/toast';

export interface MFASetupProps {
  /** Is setup dialog open? */
  isOpen: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback when MFA is successfully enabled */
  onSuccess?: () => void;
}

type SetupStep = 'enrollment' | 'verification' | 'recovery-codes' | 'complete';

export function MFASetup({ isOpen, onClose, onSuccess }: MFASetupProps) {
  const [step, setStep] = useState<SetupStep>('enrollment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enrollment data
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  // Verification
  const [verificationCode, setVerificationCode] = useState('');

  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [downloadedCodes, setDownloadedCodes] = useState(false);

  // Start enrollment process
  const handleStartEnrollment = async () => {
    setLoading(true);
    setError(null);

    const result = await enrollMFA('Authenticator App');

    if (result.success && result.qrCodeUrl && result.secret && result.factorId) {
      setQrCodeUrl(result.qrCodeUrl);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep('verification');
    } else {
      setError(result.error || 'Failed to start MFA enrollment');
    }

    setLoading(false);
  };

  // Verify enrollment with code
  const handleVerifyCode = async () => {
    if (!factorId || !verificationCode) {
      setError('Please enter a verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyMFAEnrollment(factorId, verificationCode);

    if (result.success) {
      if (result.recoveryCodes && result.recoveryCodes.length > 0) {
        setRecoveryCodes(result.recoveryCodes);
        setStep('recovery-codes');
      } else {
        setStep('complete');
      }
      toast.success('Two-factor authentication enabled successfully');
    } else {
      setError(result.error || 'Invalid verification code');
    }

    setLoading(false);
  };

  // Copy secret to clipboard
  const handleCopySecret = async () => {
    if (!secret) {
return;
}

    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (err) {
      toast.error('Failed to copy secret key');
    }
  };

  // Copy recovery codes to clipboard
  const handleCopyRecoveryCodes = async () => {
    if (!recoveryCodes.length) {
return;
}

    try {
      const codesText = recoveryCodes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      toast.success('Recovery codes copied to clipboard');
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (err) {
      toast.error('Failed to copy recovery codes');
    }
  };

  // Download recovery codes as text file
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

    setDownloadedCodes(true);
    toast.success('Recovery codes downloaded');
  };

  // Complete setup
  const handleComplete = () => {
    onSuccess?.();
    handleDialogClose();
  };

  // Reset state when dialog closes
  const handleDialogClose = () => {
    setStep('enrollment');
    setQrCodeUrl(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
    setRecoveryCodes([]);
    setCopiedSecret(false);
    setCopiedCodes(false);
    setDownloadedCodes(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-full bg-green-100 p-2 dark:bg-green-900/20">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle>
              {step === 'enrollment' && 'Enable Two-Factor Authentication'}
              {step === 'verification' && 'Verify Your Authenticator App'}
              {step === 'recovery-codes' && 'Save Recovery Codes'}
              {step === 'complete' && 'Setup Complete!'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === 'enrollment' &&
              'Add an extra layer of security to your account with two-factor authentication.'}
            {step === 'verification' &&
              'Enter the 6-digit code from your authenticator app to complete setup.'}
            {step === 'recovery-codes' &&
              'Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator app.'}
            {step === 'complete' &&
              'Two-factor authentication is now enabled on your account.'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step: Enrollment Instructions */}
        {step === 'enrollment' && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Install an authenticator app</p>
                  <p className="text-sm text-muted-foreground">
                    Download Google Authenticator, Authy, or 1Password on your smartphone
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Scan the QR code</p>
                  <p className="text-sm text-muted-foreground">
                    You'll scan a QR code to link your account to the app
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enter verification code</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your app to verify setup
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: QR Code & Verification */}
        {step === 'verification' && qrCodeUrl && secret && (
          <div className="space-y-4 py-4">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-3">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 dark:border-gray-700">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for MFA Setup"
                  className="h-48 w-48"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Scan this QR code with your authenticator app</span>
              </div>
            </div>

            {/* Manual Secret Key */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Or enter this key manually:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  className="shrink-0"
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">
                Enter 6-digit code from your app
              </Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ''))
                }
                className="text-center text-2xl tracking-wider"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step: Recovery Codes */}
        {step === 'recovery-codes' && recoveryCodes.length > 0 && (
          <div className="space-y-4 py-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Each recovery code can only be used once. Save them in a secure
                location.
              </AlertDescription>
            </Alert>

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

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyRecoveryCodes}
                className="flex-1"
              >
                {copiedCodes ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Codes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadRecoveryCodes}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="py-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Your account is now protected with two-factor authentication.
              You'll need to enter a code from your authenticator app each time
              you sign in.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'enrollment' && (
            <>
              <Button variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button onClick={handleStartEnrollment} disabled={loading}>
                {loading ? 'Starting...' : 'Continue'}
              </Button>
            </>
          )}

          {step === 'verification' && (
            <>
              <Button variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </>
          )}

          {step === 'recovery-codes' && (
            <Button
              onClick={() => setStep('complete')}
              disabled={!downloadedCodes && !copiedCodes}
              className="w-full"
            >
              {downloadedCodes || copiedCodes
                ? 'I have saved my recovery codes'
                : 'Please save your recovery codes first'}
            </Button>
          )}

          {step === 'complete' && (
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
