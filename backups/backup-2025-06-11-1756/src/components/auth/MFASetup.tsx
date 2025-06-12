'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Smartphone, Shield, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const generateMFASecret = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate MFA secret');
      }
      
      const data = await response.json();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setStep('verify');
    } catch (err) {
      setError('Failed to set up MFA. Please try again.');
      console.error('MFA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFACode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret,
          code: verificationCode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid verification code');
      }
      
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeMFASetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable MFA');
      }
      
      toast({
        title: 'MFA Enabled',
        description: 'Two-factor authentication has been successfully enabled.',
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError('Failed to enable MFA. Please try again.');
      console.error('MFA enable error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Secret key copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast({
        title: 'Copied',
        description: 'Backup codes copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Set Up Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Smartphone className="h-8 w-8 text-muted-foreground mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">1. Install an Authenticator App</h3>
                <p className="text-sm text-muted-foreground">
                  Download and install an authenticator app on your phone. We recommend:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Google Authenticator</li>
                  <li>Microsoft Authenticator</li>
                  <li>Authy</li>
                  <li>1Password</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-muted-foreground mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">2. Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  After installing the app, you&apos;ll scan a QR code to link your account.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">3. Enter Verification Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify the setup.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={generateMFASecret}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Setting up...' : 'Continue Setup'}
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Scan this QR code with your authenticator app</h3>
              
              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={qrCodeUrl} size={200} />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Or enter this secret key manually:
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="px-2 py-1 bg-muted rounded text-sm">
                    {secret}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter verification code</Label>
              <Input
                id="verification-code"
                type="text"
                Unite Group="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={verifyMFACode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important: Save Your Backup Codes</AlertTitle>
              <AlertDescription>
                These codes can be used to access your account if you lose your authenticator device. 
                Each code can only be used once. Store them in a safe place.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyBackupCodes}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-sm">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Setup Complete!</AlertTitle>
              <AlertDescription>
                Two-factor authentication is now active on your account.
              </AlertDescription>
            </Alert>

            <Button
              onClick={completeMFASetup}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Finishing setup...' : 'Complete Setup'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MFASetup;
