'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailAgent, type EmailCompositionResult } from '@/agents/email/emailAgent';
import { emailStrategy } from '@/agents/email/emailStrategy';
import { listAvailableTemplates } from '@/agents/email/emailTemplates';

/**
 * Email Agent Demo Dashboard
 *
 * Demonstrates email composition with governance integration:
 * - Risk scoring
 * - Brand safety validation
 * - Approval routing
 * - Template library
 *
 * Used by: Founder for testing, team for learning
 */
export default function EmailAgentPage() {
  const [results, setResults] = useState<EmailCompositionResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<EmailCompositionResult | null>(null);

  const handleRunDemo = async (brand: string, context: string) => {
    const template = emailStrategy.getPersonalizedEmail(brand as any, context as any, {
      name: 'John Smith',
      company: 'Local Property Management',
      role: 'Operations Manager',
    });

    if (!template) {
      alert('Template not found for this combination');
      return;
    }

    const result = await emailAgent.composeEmail({
      brand: brand as any,
      recipient: 'john@propertymanagement.com',
      recipientName: 'John Smith',
      subject: template.subject,
      body: template.body,
      context: context as any,
      isPublicFacing: false,
    });

    setResults([result, ...results]);
    setSelectedResult(result);
  };

  const templates = listAvailableTemplates();

  const brands = ['disaster_recovery_au', 'carsi', 'synthex', 'unite_hub'];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Email Agent Demo</h1>
        <p className="text-text-muted">
          Autonomous email composition with governance, risk scoring, brand safety, and approval routing.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="results">
            Results ({results.length})
          </TabsTrigger>
          <TabsTrigger value="documentation">How It Works</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(templates).map(([context, availableBrands]) => (
              <Card key={context}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{context} Emails</CardTitle>
                  <CardDescription>
                    {availableBrands.length} brand(s) available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {brands.map((brand) => {
                      const isAvailable = availableBrands.includes(brand);
                      return (
                        <button
                          key={`${context}-${brand}`}
                          onClick={() => handleRunDemo(brand, context)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            isAvailable
                              ? 'bg-info-600 text-white hover:bg-info-700 cursor-pointer'
                              : 'bg-bg-hover text-text-tertiary cursor-not-allowed'
                          }`}
                        >
                          {brand.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-text-muted">
                  No emails composed yet. Try selecting a template above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className={`cursor-pointer ${
                    selectedResult?.id === result.id ? 'border-2 border-info-600' : ''
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{result.request.subject}</CardTitle>
                        <CardDescription className="text-sm">
                          To: {result.request.recipient}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            result.riskAssessment.level === 'critical'
                              ? 'destructive'
                              : result.riskAssessment.level === 'high'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {result.riskAssessment.level.toUpperCase()}
                        </Badge>
                        <Badge
                          variant={result.readyToSend ? 'default' : 'secondary'}
                        >
                          {result.approvalStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {selectedResult && (
            <Card className="border-2 border-info-600">
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Content */}
                <div>
                  <p className="font-medium mb-2">Subject</p>
                  <p className="text-sm bg-bg-hover p-3 rounded">
                    {selectedResult.request.subject}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">Body</p>
                  <p className="text-sm bg-bg-hover p-3 rounded whitespace-pre-wrap">
                    {selectedResult.request.body}
                  </p>
                </div>

                {/* Risk Assessment */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Risk Assessment</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Score</span>
                      <span className="font-bold">
                        {selectedResult.riskAssessment.score}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Level</span>
                      <Badge>{selectedResult.riskAssessment.level.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <span>Reasons</span>
                      <ul className="mt-1 space-y-1">
                        {selectedResult.riskAssessment.reasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-text-muted">
                            • {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Brand Alignment */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Brand Alignment</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Aligned</span>
                      <Badge
                        variant={selectedResult.brandAlignment.aligned ? 'default' : 'destructive'}
                      >
                        {selectedResult.brandAlignment.aligned ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {selectedResult.brandAlignment.issues.length > 0 && (
                      <div>
                        <span>Issues</span>
                        <ul className="mt-1 space-y-1">
                          {selectedResult.brandAlignment.issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-error-600">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Status */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Approval Status</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge>{selectedResult.approvalStatus}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Ready to Send</span>
                      <Badge variant={selectedResult.readyToSend ? 'default' : 'secondary'}>
                        {selectedResult.readyToSend ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedResult.readyToSend && (
                  <div className="border-t pt-4">
                    <button className="w-full px-4 py-2 bg-success-600 text-white rounded hover:bg-success-700">
                      Send Email
                    </button>
                  </div>
                )}

                {selectedResult.approvalStatus === 'pending_approval' && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-xs text-text-muted">
                      This email requires founder approval. Forward to founder for decision.
                    </p>
                    <button className="w-full px-4 py-2 bg-accent-600 text-white rounded hover:bg-accent-700">
                      Send to Founder for Approval
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How the Email Agent Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">1. Template Selection</p>
                <p className="text-text-secondary">
                  Choose from pre-approved templates for each brand and context (follow-up, introduction, re-engagement, educational).
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">2. Personalization</p>
                <p className="text-text-secondary">
                  Templates are personalized with recipient name, company, and context automatically.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">3. Risk Scoring</p>
                <p className="text-text-secondary">
                  Every email is automatically scored for risk: 0-19 (low), 20-39 (medium), 40-69 (high), 70+ (critical).
                  Risk factors include financial promises, medical claims, brand risk flags, and public vs internal context.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">4. Brand Safety</p>
                <p className="text-text-secondary">
                  Email tone and messaging are validated against brand positioning guidelines. Any conflicts are flagged.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">5. Approval Routing</p>
                <p className="text-text-secondary">
                  Low risk emails auto-approve and are ready to send. Medium/high risk emails go to content review or founder approval.
                  Critical risk emails are always escalated to founder.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">6. Audit Trail</p>
                <p className="text-text-secondary">
                  Every step is logged: composition, risk assessment, brand check, approval decision. Complete transparency for founder.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">7. Queue Management</p>
                <p className="text-text-secondary">
                  Approved emails go to the queue and can be sent immediately or scheduled. Rejected emails are archived with feedback.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Scoring Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="border rounded p-3 bg-success-50">
                <p className="font-medium text-success-900">Low Risk (Score: 15)</p>
                <p className="text-xs mt-1">Standard follow-up email with no claims</p>
              </div>

              <div className="border rounded p-3 bg-warning-50">
                <p className="font-medium text-warning-900">Medium Risk (Score: 35)</p>
                <p className="text-xs mt-1">Email mentioning financial benefit + public context</p>
              </div>

              <div className="border rounded p-3 bg-accent-50">
                <p className="font-medium text-accent-900">High Risk (Score: 55)</p>
                <p className="text-xs mt-1">
                  Email promising guaranteed results (violates brand risk flag)
                </p>
              </div>

              <div className="border rounded p-3 bg-error-50">
                <p className="font-medium text-error-900">Critical Risk (Score: 75)</p>
                <p className="text-xs mt-1">Email making health claims or legal guarantees</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-info-50 border-info-200">
        <CardHeader>
          <CardTitle className="text-sm">Email Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary">
          <p>
            Email Agent v1.0 – Governance integrated. All emails evaluated for risk, brand safety,
            and approval requirements before sending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
