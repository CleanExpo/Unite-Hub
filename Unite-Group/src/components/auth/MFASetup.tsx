"use client";

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  generateSecret, 
  generateTOTPQRCodeURL, 
  validateTOTP 
} from '@/lib/auth/mfa/totp';

interface MFASetupProps {
  userId: string;
  userEmail: string;
  onSetupComplete: (secret: string) => Promise<void>;
  onCancel: () => void;
}

export default function MFASetup({ 
  userId, 
  userEmail, 
  onSetupComplete, 
  onCancel 
}: MFASetupProps) {
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'generate' | 'verify'>('generate');

  // Generate a new secret when the component mounts
  useEffect(() => {
    generateNewSecret();
  }, []);

  const generateNewSecret = useCallback(() => {
    const newSecret = generateSecret();
    setSecret(newSecret);

    const newQrCodeUrl = generateTOTPQRCodeURL(
      newSecret,
      userEmail,
      'UNITE Group',
      {
        digits: 6,
        period: 30,
      }
    );
    setQrCodeUrl(newQrCodeUrl);
    setError('');
    setVerificationCode('');
  }, [userEmail]);

  const handleVerify = useCallback(async () => {
    if (!verificationCode) {
      setError('Please enter the verification code from your authenticator app');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = validateTOTP(verificationCode, secret);
      
      if (isValid) {
        await onSetupComplete(secret);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, secret, onSetupComplete]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Multi-Factor Authentication Setup</h2>
      
      {step === 'generate' ? (
        <>
          <div className="mb-6">
            <p className="mb-4">
              Enhance your account security by setting up multi-factor authentication (MFA). 
              Follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</li>
              <li>Scan the QR code below with your app</li>
              <li>Click "Continue" to verify your setup</li>
            </ol>
          </div>

          <div className="flex justify-center mb-6">
            {qrCodeUrl && (
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={qrCodeUrl} 
                  size={200} 
                  bgColor={"#ffffff"} 
                  fgColor={"#000000"} 
                  level={"L"} 
                  includeMargin={false} 
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              If you can't scan the QR code, enter this code manually in your app:
            </p>
            <div className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded text-center tracking-wider select-all">
              {secret}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep('verify')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <p className="mb-4">
              To verify your setup, enter the 6-digit code from your authenticator app:
            </p>
            <div className="mt-4">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  // Only allow digits and limit to 6 characters
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('generate')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isVerifying || verificationCode.length !== 6
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Enable MFA'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
