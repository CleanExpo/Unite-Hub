/**
 * ABN/TFN Verification Dashboard
 *
 * Verify Australian Business Numbers (ABN) and Tax File Numbers (TFN):
 * - Auto-detect identifier type
 * - Format validation
 * - Check digit validation
 * - ABR API lookup (ABN only)
 * - ATO API lookup (ABN only, with workspace)
 * - GST registration status
 * - Entity information
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  CheckCircle,
  XCircle,
  Info,
  Building,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface VerificationResult {
  type: 'abn' | 'tfn';
  isValid: boolean;
  identifier: string;
  error?: string;
  entityName?: string;
  entityType?: string;
  status?: 'active' | 'inactive' | 'cancelled';
  gstRegistered?: boolean;
  registeredDate?: string;
  abrUrl?: string;
  source?: 'local' | 'abr' | 'ato';
  cached?: boolean;
  verifiedAt: string;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [identifier, setIdentifier] = useState('');
  const [verificationType, setVerificationType] = useState<'auto' | 'abn' | 'tfn'>('auto');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!identifier.trim()) {
      alert('Please enter an ABN or TFN');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/integrations/ato/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type: verificationType,
          workspaceId: workspaceId || undefined,
          useCache: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        alert(`Verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify identifier');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-400';
    if (status === 'active') return 'text-emerald-400';
    if (status === 'cancelled') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            ABN/TFN Verification
          </h1>
          <p className="text-gray-400 mt-2">
            Verify Australian Business Numbers and Tax File Numbers
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              ABN or TFN
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="51 824 753 556 (ABN) or 123 456 782 (TFN)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Verification Type
            </label>
            <select
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value as 'auto' | 'abn' | 'tfn')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            >
              <option value="auto">Auto-detect</option>
              <option value="abn">ABN Only</option>
              <option value="tfn">TFN Only</option>
            </select>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shield className="h-5 w-5" />
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {/* Verification Result */}
        {result && (
          <div className={`bg-gray-900 border-2 rounded-lg p-6 space-y-4 ${
            result.isValid ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            {/* Status Header */}
            <div className="flex items-center gap-3">
              {result.isValid ? (
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-100">
                  {result.isValid ? 'Valid' : 'Invalid'} {result.type.toUpperCase()}
                </h2>
                <p className="text-gray-400 font-mono">{result.identifier}</p>
              </div>
            </div>

            {/* Error Message */}
            {result.error && (
              <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-4 text-red-400">
                {result.error}
              </div>
            )}

            {/* ABN Details */}
            {result.isValid && result.type === 'abn' && (
              <div className="space-y-3">
                {result.entityName && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-blue-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-400">Entity Name</div>
                      <div className="text-lg font-semibold">{result.entityName}</div>
                    </div>
                  </div>
                )}

                {result.entityType && (
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-400">Entity Type</div>
                      <div className="text-lg">{result.entityType}</div>
                    </div>
                  </div>
                )}

                {result.status && (
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-400">Status</div>
                      <div className={`text-lg font-semibold capitalize ${getStatusColor(result.status)}`}>
                        {result.status}
                      </div>
                    </div>
                  </div>
                )}

                {result.gstRegistered !== undefined && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 mt-1 ${result.gstRegistered ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <div>
                      <div className="text-sm text-gray-400">GST Registered</div>
                      <div className="text-lg">{result.gstRegistered ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                )}

                {result.registeredDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-400">Registered Date</div>
                      <div className="text-lg">{result.registeredDate}</div>
                    </div>
                  </div>
                )}

                {result.abrUrl && (
                  <a
                    href={result.abrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on ABR
                  </a>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-800 pt-4 flex gap-6 text-sm text-gray-400">
              {result.source && (
                <div>
                  Source: <span className="text-gray-300 uppercase">{result.source}</span>
                </div>
              )}
              {result.cached && (
                <div className="text-yellow-400">Cached</div>
              )}
              <div>
                Verified: {new Date(result.verifiedAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-100 mb-2">ABN (11 digits)</h3>
            <p className="text-sm text-gray-400">
              Australian Business Number. Used for GST registration and business identification.
              Validated against ABR/ATO databases.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-100 mb-2">TFN (8-9 digits)</h3>
            <p className="text-sm text-gray-400">
              Tax File Number. Private identifier. Only format and check digit validation available
              (no public API).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
