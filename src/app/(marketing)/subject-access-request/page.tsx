"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Shield, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

type SARRequestType = 'access' | 'correction' | 'deletion' | 'export' | 'restriction' | 'objection';

interface SARStatusResponse {
  id: string;
  email: string;
  requestType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  rejectionReason?: string;
}

export default function SubjectAccessRequestPage() {
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState<SARRequestType>('access');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [requestId, setRequestId] = useState('');

  // Check status functionality
  const [checkRequestId, setCheckRequestId] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusData, setStatusData] = useState<SARStatusResponse | null>(null);
  const [statusError, setStatusError] = useState('');

  const requestTypeOptions = [
    { value: 'access', label: 'Access - Request a copy of my personal information', icon: FileText },
    { value: 'correction', label: 'Correction - Update inaccurate information', icon: FileText },
    { value: 'deletion', label: 'Deletion - Request deletion of my data', icon: FileText },
    { value: 'export', label: 'Export - Download my data in portable format', icon: FileText },
    { value: 'restriction', label: 'Restriction - Temporarily restrict data processing', icon: FileText },
    { value: 'objection', label: 'Objection - Object to certain processing activities', icon: FileText },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/privacy/subject-access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requestType, details }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitSuccess(true);
      setRequestId(data.requestId);
      setEmail('');
      setDetails('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingStatus(true);
    setStatusError('');
    setStatusData(null);

    try {
      const response = await fetch(`/api/privacy/subject-access-request?id=${encodeURIComponent(checkRequestId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setStatusData(data);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Subject Access Request</h1>
          <p className="text-lg text-muted-foreground">
            Exercise your rights under the Australian Privacy Principles (APPs)
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>Access:</strong> Request a copy of your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>Correction:</strong> Update inaccurate information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>Deletion:</strong> Request data removal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span><strong>Export:</strong> Download your data</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Processing Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-medium">1-2 days:</span>
                  <span>Verification of your identity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">30 days:</span>
                  <span>Standard request completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">60 days:</span>
                  <span>Complex requests (we'll notify you)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Submit Request Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit a New Request</CardTitle>
            <CardDescription>
              Fill out the form below to submit a Subject Access Request. We'll send a confirmation email to verify your identity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Request Submitted Successfully!</h3>
                <p className="text-green-700 mb-4">
                  Your request ID is: <span className="font-mono font-bold">{requestId}</span>
                </p>
                <p className="text-sm text-green-600 mb-4">
                  We've sent a confirmation email to <strong>{email}</strong> with your verification code.
                  Please check your inbox (and spam folder).
                </p>
                <Button onClick={() => setSubmitSuccess(false)} variant="outline">
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send a verification code to this email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">Request Type *</Label>
                  <Select value={requestType} onValueChange={(value) => setRequestType(value as SARRequestType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Additional Details (Optional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Provide any additional information that will help us process your request..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                  />
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Important:</strong> By submitting this request, you confirm that you are the data subject
                    or have authorization to act on their behalf. We will verify your identity before processing.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Check Status Form */}
        <Card>
          <CardHeader>
            <CardTitle>Check Request Status</CardTitle>
            <CardDescription>
              Enter your request ID to check the status of your Subject Access Request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your request ID"
                  value={checkRequestId}
                  onChange={(e) => setCheckRequestId(e.target.value)}
                  required
                />
                <Button type="submit" disabled={isCheckingStatus}>
                  {isCheckingStatus ? 'Checking...' : 'Check Status'}
                </Button>
              </div>

              {statusError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{statusError}</p>
                </div>
              )}

              {statusData && (
                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Request Status</h3>
                      <p className="text-sm text-muted-foreground">ID: {statusData.id}</p>
                    </div>
                    {getStatusBadge(statusData.status)}
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {statusData.email}
                    </div>
                    <div>
                      <span className="font-medium">Request Type:</span>{' '}
                      {requestTypeOptions.find(o => o.value === statusData.requestType)?.label || statusData.requestType}
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span>{' '}
                      {new Date(statusData.createdAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {statusData.completedAt && (
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {new Date(statusData.completedAt).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    {statusData.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <span className="font-medium">Rejection Reason:</span>
                        <p className="mt-1">{statusData.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions about your privacy rights?{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Read our Privacy Policy
            </Link>{' '}
            or contact us at{' '}
            <a href="mailto:privacy@unite-hub.com.au" className="text-primary hover:underline">
              privacy@unite-hub.com.au
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
