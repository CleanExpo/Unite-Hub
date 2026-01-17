'use client';

/**
 * External Reports & Investor Packs Dashboard
 *
 * Phase: D54 - External Reporting & Investor Pack Engine
 *
 * Features:
 * - Report templates management
 * - AI-powered report generation
 * - Multi-audience support
 * - Export tracking (PDF, PowerPoint, etc.)
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, FileText, Users, Download, Sparkles, Send } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

type Tab = 'templates' | 'reports';
type ReportStatus = 'draft' | 'generating' | 'review' | 'finalized' | 'sent' | 'archived';
type AudienceType = 'investor' | 'board' | 'partner' | 'stakeholder' | 'internal' | 'public';

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  frequency: string;
  default_audience: AudienceType;
  is_active: boolean;
  created_at: string;
}

interface Report {
  id: string;
  title: string;
  period_start?: string;
  period_end?: string;
  status: ReportStatus;
  audience_type: AudienceType;
  exported_formats?: string[];
  generated_at?: string;
  created_at: string;
}

interface ReportAudience {
  id: string;
  audience_name: string;
  audience_type: AudienceType;
  email_list?: string[];
  view_count: number;
}

// =============================================================================
// Component
// =============================================================================

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [audiences, setAudiences] = useState<ReportAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);

  // Form states
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('investor_update');

  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportTemplateId, setNewReportTemplateId] = useState('');
  const [newReportAudienceType, setNewReportAudienceType] = useState<AudienceType>('investor');
  const [newReportPeriodStart, setNewReportPeriodStart] = useState('');
  const [newReportPeriodEnd, setNewReportPeriodEnd] = useState('');

  // Fetch data
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else {
      fetchReports();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedReport) {
      fetchAudiences(selectedReport.id);
    }
  }, [selectedReport]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/synthex/reports/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/synthex/reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudiences = async (reportId: string) => {
    try {
      const response = await fetch(`/api/synthex/reports?action=audiences&id=${reportId}`);
      const data = await response.json();
      setAudiences(data.audiences || []);
    } catch (error) {
      console.error('Failed to fetch audiences:', error);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/synthex/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDescription,
          category: newTemplateCategory,
        }),
      });

      if (response.ok) {
        setShowCreateTemplateModal(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const createReport = async () => {
    try {
      const response = await fetch('/api/synthex/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: newReportTemplateId,
          title: newReportTitle,
          audience_type: newReportAudienceType,
          period_start: newReportPeriodStart || undefined,
          period_end: newReportPeriodEnd || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateReportModal(false);
        setNewReportTitle('');
        setNewReportTemplateId('');
        setNewReportPeriodStart('');
        setNewReportPeriodEnd('');
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await fetch(`/api/synthex/reports/templates?action=delete&id=${templateId}`, {
        method: 'POST',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Delete this report?')) return;

    try {
      await fetch(`/api/synthex/reports?action=delete&id=${reportId}`, {
        method: 'POST',
      });
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const generateAIReport = async (templateId: string) => {
    try {
      const response = await fetch('/api/synthex/reports?action=ai_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          data_snapshot: { /* Sample data */ },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Report generated! Check the AI-generated sections.');
        console.log('Generated:', data.generated);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (loading && (activeTab === 'templates' ? templates.length === 0 : reports.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-app">
        <RefreshCw className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  const statusColors: Record<ReportStatus, string> = {
    draft: 'text-text-muted',
    generating: 'text-info-400',
    review: 'text-warning-400',
    finalized: 'text-success-400',
    sent: 'text-purple-400',
    archived: 'text-text-tertiary',
  };

  const audienceColors: Record<AudienceType, string> = {
    investor: 'text-success-400',
    board: 'text-purple-400',
    partner: 'text-info-400',
    stakeholder: 'text-accent-400',
    internal: 'text-text-muted',
    public: 'text-info-400',
  };

  return (
    <div className="min-h-screen bg-bg-app p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Reports & Investor Packs</h1>
            <p className="text-text-secondary">Professional reports for external audiences</p>
          </div>
          <button
            onClick={() => activeTab === 'templates' ? setShowCreateTemplateModal(true) : setShowCreateReportModal(true)}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-white hover:bg-accent-600"
          >
            <Plus className="h-5 w-5" />
            {activeTab === 'templates' ? 'New Template' : 'New Report'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'templates'
                ? 'border-b-2 border-accent-500 text-accent-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'reports'
                ? 'border-b-2 border-accent-500 text-accent-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Reports
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-lg bg-bg-card p-4 border border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{template.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateAIReport(template.id)}
                      className="text-accent-500 hover:text-accent-600"
                      title="AI Generate"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-text-tertiary hover:text-error-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-text-tertiary">
                  <div>Category: {template.category || 'N/A'}</div>
                  <div>Frequency: {template.frequency}</div>
                  <div className={audienceColors[template.default_audience]}>
                    Default: {template.default_audience}
                  </div>
                  <div>{template.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="col-span-3 rounded-lg border border-dashed border-border-default bg-bg-card p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-text-tertiary mb-3" />
                <p className="text-text-secondary">No templates yet. Create your first template to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-4 gap-6">
            {/* Report List */}
            <div className="col-span-1 space-y-2">
              <h2 className="text-lg font-semibold text-text-primary mb-2">Reports</h2>
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`cursor-pointer rounded-lg p-3 border ${
                    selectedReport?.id === report.id
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-border-default bg-bg-card hover:border-accent-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text-primary text-sm">{report.title}</div>
                      <div className={`text-xs ${statusColors[report.status]}`}>
                        {report.status}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(report.id);
                      }}
                      className="text-text-tertiary hover:text-error-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {report.period_end && (
                    <div className="text-xs text-text-tertiary mt-1">{report.period_end}</div>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <div className="rounded-lg border border-dashed border-border-default bg-bg-card p-6 text-center text-sm text-text-secondary">
                  No reports yet
                </div>
              )}
            </div>

            {/* Report Details */}
            <div className="col-span-3">
              {selectedReport ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">{selectedReport.title}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-sm ${statusColors[selectedReport.status]}`}>
                          {selectedReport.status}
                        </span>
                        <span className={`text-sm ${audienceColors[selectedReport.audience_type]}`}>
                          {selectedReport.audience_type}
                        </span>
                        {selectedReport.period_start && selectedReport.period_end && (
                          <span className="text-sm text-text-tertiary">
                            {selectedReport.period_start} to {selectedReport.period_end}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedReport.exported_formats && selectedReport.exported_formats.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-text-tertiary" />
                          <span className="text-xs text-text-secondary">
                            {selectedReport.exported_formats.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audiences */}
                  <div className="rounded-lg bg-bg-card p-4 border border-border-default">
                    <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Audiences ({audiences.length})
                    </h3>
                    {audiences.length === 0 ? (
                      <p className="text-sm text-text-secondary">No audiences configured yet</p>
                    ) : (
                      <div className="space-y-2">
                        {audiences.map((audience) => (
                          <div key={audience.id} className="flex items-center justify-between rounded bg-bg-app p-3">
                            <div>
                              <div className="font-medium text-text-primary text-sm">{audience.audience_name}</div>
                              <div className={`text-xs ${audienceColors[audience.audience_type]}`}>
                                {audience.audience_type}
                                {audience.email_list && ` • ${audience.email_list.length} recipients`}
                              </div>
                            </div>
                            <div className="text-sm text-text-secondary">
                              {audience.view_count} views
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border-default bg-bg-card p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-text-tertiary mb-3" />
                  <p className="text-text-secondary">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-bg-card p-6 border border-border-default">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Create Report Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    placeholder="Q4 2025 Investor Update"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                  >
                    <option value="investor_update">Investor Update</option>
                    <option value="board_deck">Board Deck</option>
                    <option value="partner_report">Partner Report</option>
                    <option value="annual_report">Annual Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="rounded bg-bg-app px-4 py-2 text-text-secondary hover:bg-bg-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  disabled={!newTemplateName}
                  className="rounded bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-bg-card p-6 border border-border-default">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Create Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={newReportTitle}
                    onChange={(e) => setNewReportTitle(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    placeholder="Q4 2025 Performance Report"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Template</label>
                  <select
                    value={newReportTemplateId}
                    onChange={(e) => setNewReportTemplateId(e.target.value)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                  >
                    <option value="">Select template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Audience Type</label>
                  <select
                    value={newReportAudienceType}
                    onChange={(e) => setNewReportAudienceType(e.target.value as AudienceType)}
                    className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                  >
                    <option value="investor">Investor</option>
                    <option value="board">Board</option>
                    <option value="partner">Partner</option>
                    <option value="stakeholder">Stakeholder</option>
                    <option value="internal">Internal</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Period Start</label>
                    <input
                      type="date"
                      value={newReportPeriodStart}
                      onChange={(e) => setNewReportPeriodStart(e.target.value)}
                      className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Period End</label>
                    <input
                      type="date"
                      value={newReportPeriodEnd}
                      onChange={(e) => setNewReportPeriodEnd(e.target.value)}
                      className="w-full rounded border border-border-default bg-bg-app px-3 py-2 text-text-primary focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateReportModal(false)}
                  className="rounded bg-bg-app px-4 py-2 text-text-secondary hover:bg-bg-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={createReport}
                  disabled={!newReportTitle || !newReportTemplateId}
                  className="rounded bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
