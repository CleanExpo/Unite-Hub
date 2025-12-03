/**
 * MFA Challenge Component
 *
 * Displays during login when user has MFA enabled.
 * Handles 6-digit TOTP code verification and recovery code fallback.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Shield, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import { verifyMFAChallenge, verifyRecoveryCode } from '@/lib/auth/mfa';

export interface MFAChallengeProps {
  /** Is challenge dialog open? */
  isOpen: boolean;
  /** Factor ID to verify */
  factorId: string;
  /** Callback when MFA is successfully verified */
  onSuccess: () => void;
  /** Callback when challenge is cancelled */
  onCancel: () => void;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
}

type ChallengeMode = 'totp' | 'recovery';

export function MFAChallenge({
  isOpen,
  factorId,
  onSuccess,
  onCancel,
  title = 'Two-Factor Authentication',
  description = 'Enter the 6-digit code from your authenticator app to continue.',
}: MFAChallengeProps) {
  const [mode, setMode] = useState<ChallengeMode>('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when mode changes
  useEffect(() => {
    setCode('');
    setError(null);
  }, [mode]);

  // Handle code verification
  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    if (mode === 'totp' && code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      if (mode === 'totp') {
        result = await verifyMFAChallenge(factorId, code);
      } else {
        result = await verifyRecoveryCode(code);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(
          result.error ||
            (mode === 'totp'
              ? 'Invalid verification code. Please try again.'
              : 'Invalid recovery code. Please try again.')
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setMode('totp');
    setCode('');
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
              {mode === 'totp' ? (
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {mode === 'totp'
              ? description
              : 'Enter one of your recovery codes to access your account.'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* TOTP Mode */}
          {mode === 'totp' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="totp-code">Authentication Code</Label>
                <Input
                  ref={inputRef}
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={handleKeyPress}
                  className="text-center text-2xl tracking-wider"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Open your authenticator app to get your code
                </p>
              </div>

              {/* Switch to Recovery Code */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setMode('recovery')}
                  className="text-xs"
                >
                  Lost access to your authenticator? Use a recovery code
                </Button>
              </div>
            </>
          )}

          {/* Recovery Code Mode */}
          {mode === 'recovery' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recovery-code">Recovery Code</Label>
                <Input
                  ref={inputRef}
                  id="recovery-code"
                  type="text"
                  placeholder="Enter recovery code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Recovery codes were provided when you set up two-factor
                  authentication
                </p>
              </div>

              {/* Switch back to TOTP */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setMode('totp')}
                  className="text-xs"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to authenticator code
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={
              loading ||
              !code ||
              (mode === 'totp' && code.length !== 6)
            }
            className="w-full sm:w-auto"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// INLINE MFA CHALLENGE (for login pages)
// =====================================================

export interface InlineMFAChallengeProps {
  /** Factor ID to verify */
  factorId: string;
  /** Callback when MFA is successfully verified */
  onSuccess: () => void;
  /** Callback when user wants to go back */
  onBack?: () => void;
}

/**
 * Inline MFA Challenge (no modal)
 * Use this in login flows where you want embedded challenge
 */
export function InlineMFAChallenge({
  factorId,
  onSuccess,
  onBack,
}: InlineMFAChallengeProps) {
  const [mode, setMode] = useState<ChallengeMode>('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setCode('');
    setError(null);
  }, [mode]);

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    if (mode === 'totp' && code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      if (mode === 'totp') {
        result = await verifyMFAChallenge(factorId, code);
      } else {
        result = await verifyRecoveryCode(code);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(
          result.error ||
            (mode === 'totp'
              ? 'Invalid verification code. Please try again.'
              : 'Invalid recovery code. Please try again.')
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
          {mode === 'totp' ? (
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'totp'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter one of your recovery codes'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* TOTP Mode */}
      {mode === 'totp' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="inline-totp-code">Authentication Code</Label>
            <Input
              ref={inputRef}
              id="inline-totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl tracking-wider"
              disabled={loading}
            />
          </div>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setMode('recovery')}
              className="text-xs"
            >
              Lost access? Use a recovery code
            </Button>
          </div>
        </>
      )}

      {/* Recovery Code Mode */}
      {mode === 'recovery' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="inline-recovery-code">Recovery Code</Label>
            <Input
              ref={inputRef}
              id="inline-recovery-code"
              type="text"
              placeholder="Enter recovery code"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onKeyPress={handleKeyPress}
              className="font-mono"
              disabled={loading}
            />
          </div>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setMode('totp')}
              className="text-xs"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to authenticator code
            </Button>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleVerify}
          disabled={
            loading ||
            !code ||
            (mode === 'totp' && code.length !== 6)
          }
          className="flex-1"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Button>
      </div>
    </div>
  );
}
