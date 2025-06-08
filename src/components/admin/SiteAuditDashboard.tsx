'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Link, 
  Image, 
  MousePointer,
  MessageSquare,
  Clock,
  Download,
  RefreshCw,
  Search
} from 'lucide-react';
import type { AuditReport, AuditIssue } from '@/lib/utils/site-audit';

interface SiteAuditDashboardProps {
  onRunAudit?: () => Promise<AuditReport>;
}

export default function SiteAuditDashboard({ onRunAudit }: SiteAuditDashboardProps) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const runAudit = async () => {
    if (!onRunAudit) return;
    
    setLoading(true);
    try {
      const auditReport = await onRunAudit();
      setReport(auditReport);
      localStorage.setItem('lastAuditReport', JSON.stringify(auditReport));
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load last report from localStorage
    const savedReport = localStorage.getItem('lastAuditReport');
    if (savedReport) {
      try {
        setReport(JSON.parse(savedReport));
      } catch (error) {
        console.error('Failed to load saved report:', error);
      }
    }
  }, []);

  const getIssueIcon = (type: AuditIssue['type']) => {
    switch (type) {
      case 'placeholder':
        return <FileText className="h-4 w-4" />;
      case 'dead-link':
        return <Link className="h-4 w-4" />;
      case 'missing-image':
        return <Image className="h-4 w-4" />;
      case 'empty-button':
        return <MousePointer className="h-4 w-4" />;
      case 'todo-comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'coming-soon':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: AuditIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredIssues = report?.issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.type !== selectedCategory) {
      return false;
    }
    if (searchTerm && !issue.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !issue.file.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const exportToCSV = () => {
    if (!report) return;
    
    const csv = [
      'Type,Severity,File,Line,Message,Context',
      ...report.issues.map(issue => 
        `"${issue.type}","${issue.severity}","${issue.file}","${issue.line || ''}","${issue.message}","${issue.context || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Audit Dashboard</h2>
          <p className="text-muted-foreground">
            Detect and fix placeholders, dead links, and other issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAudit}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Run Audit
              </>
            )}
          </Button>
          {report && (
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Last scan: {new Date(report.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {report.criticalIssues}
                </div>
                <Progress 
                  value={(report.criticalIssues / report.totalIssues) * 100} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {report.warningIssues}
                </div>
                <Progress 
                  value={(report.warningIssues / report.totalIssues) * 100} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(100 - (report.criticalIssues * 10 + report.warningIssues * 2))}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Site health rating
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issue Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Breakdown</CardTitle>
              <CardDescription>
                Distribution of issues by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Placeholders</span>
                  </div>
                  <Badge variant="secondary">{report.summary.placeholders}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Dead Links</span>
                  </div>
                  <Badge variant="destructive">{report.summary.deadLinks}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Empty Buttons</span>
                  </div>
                  <Badge variant="destructive">{report.summary.emptyButtons}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">TODO Comments</span>
                  </div>
                  <Badge variant="secondary">{report.summary.todoComments}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Coming Soon</span>
                  </div>
                  <Badge variant="secondary">{report.summary.comingSoon}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Missing Images</span>
                  </div>
                  <Badge variant="secondary">{report.summary.missingImages}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Issues</CardTitle>
              <CardDescription>
                Click on an issue to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="placeholder">Placeholders</TabsTrigger>
                    <TabsTrigger value="dead-link">Dead Links</TabsTrigger>
                    <TabsTrigger value="empty-button">Empty Buttons</TabsTrigger>
                    <TabsTrigger value="todo-comment">TODOs</TabsTrigger>
                    <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
                  </TabsList>
                  <input
                    type="text"
                    placeholder="Search issues..."
                    className="px-3 py-1 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <TabsContent value={selectedCategory} className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredIssues.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No issues found</AlertTitle>
                      <AlertDescription>
                        {searchTerm 
                          ? `No issues matching "${searchTerm}"`
                          : 'No issues in this category'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    filteredIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="mt-1">
                          {getIssueIcon(issue.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                            <span className="text-sm font-medium">{issue.message}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {issue.file}
                            {issue.line && ` (Line ${issue.line})`}
                          </p>
                          {issue.context && (
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              <code>{issue.context}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
