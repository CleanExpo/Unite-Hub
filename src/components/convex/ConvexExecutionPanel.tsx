'use client';

/**
 * CONVEX Execution Panel Component
 *
 * Template selection, variable input, and execution roadmap builder:
 * - Template category browser (landing page, SEO plan, paid ads, offer architecture)
 * - Template preview with example outputs
 * - Variable input fields for customization
 * - Implementation timeline generator
 * - Task checklist generation
 * - Progress tracking and milestone monitoring
 *
 * Performance Target: <1s template load, <100ms interactions, <2s roadmap generation
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
  Download,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

type TemplateType = 'landing_page' | 'seo_plan' | 'paid_ads' | 'offer_architecture';

interface TemplateMetadata {
  id: string;
  type: TemplateType;
  name: string;
  description: string;
  estimatedDuration: number; // hours
  difficulty: 'easy' | 'medium' | 'hard';
  expectedResults: string;
  variables: {
    name: string;
    type: 'text' | 'number' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
  }[];
}

interface MilestoneTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  successCriteria: string[];
}

interface ExecutionMilestone {
  week: number;
  title: string;
  objectives: string[];
  tasks: MilestoneTask[];
  successMetrics: string[];
  completionPercentage: number;
}

interface ExecutionRoadmap {
  templateId: string;
  templateName: string;
  startDate: string;
  totalDuration: number; // weeks
  milestones: ExecutionMilestone[];
  overallProgress: number; // 0-100
  riskFactors: string[];
  supportResources: string[];
}

// ============================================================================
// TEMPLATES DATABASE (Mock)
// ============================================================================

const TEMPLATES: TemplateMetadata[] = [
  {
    id: 'lp-1',
    type: 'landing_page',
    name: 'High-Conversion Landing Page',
    description: 'CONVEX-optimized landing page with micro-commitment sequence',
    estimatedDuration: 20,
    difficulty: 'medium',
    expectedResults: '3-5% conversion rate on cold traffic',
    variables: [
      { name: 'Headline', type: 'text', required: true },
      { name: 'Subheadline', type: 'text', required: true },
      { name: 'Unique Value Proposition', type: 'textarea', required: true },
      { name: 'Primary CTA Text', type: 'text', required: true },
      { name: 'Target Audience', type: 'text', required: true },
    ],
  },
  {
    id: 'seo-1',
    type: 'seo_plan',
    name: 'Topical Authority SEO Blueprint',
    description: 'Complete pillar + cluster strategy for 12-month ranking domination',
    estimatedDuration: 40,
    difficulty: 'hard',
    expectedResults: 'Page 1 rankings for primary + 15-20 secondary keywords',
    variables: [
      { name: 'Primary Keyword', type: 'text', required: true },
      { name: 'Target Geographic Location', type: 'text', required: false },
      { name: 'Content Team Size', type: 'select', required: true, options: ['1-3', '4-6', '7+'] },
      { name: 'Current Monthly Traffic', type: 'number', required: true },
      { name: 'Pillar Topics', type: 'textarea', required: true },
    ],
  },
  {
    id: 'ads-1',
    type: 'paid_ads',
    name: 'Multi-Platform Paid Ads Strategy',
    description: 'Coordinated ads across Google, Facebook, LinkedIn with unified messaging',
    estimatedDuration: 15,
    difficulty: 'medium',
    expectedResults: '1.5-2.5x ROAS with proper optimization',
    variables: [
      { name: 'Monthly Budget', type: 'number', required: true },
      { name: 'Primary Platform', type: 'select', required: true, options: ['Google', 'Facebook', 'LinkedIn'] },
      { name: 'Core Message', type: 'textarea', required: true },
      { name: 'Target Audience Profile', type: 'textarea', required: true },
    ],
  },
  {
    id: 'offer-1',
    type: 'offer_architecture',
    name: 'Compelling Offer Design',
    description: '10-point offer strength assessment and risk reversal architecture',
    estimatedDuration: 12,
    difficulty: 'easy',
    expectedResults: '20-30% increase in conversion rate',
    variables: [
      { name: 'Core Product/Service', type: 'text', required: true },
      { name: 'Target Price Point', type: 'number', required: true },
      { name: 'Main Customer Objection', type: 'textarea', required: true },
      { name: 'Unique Selling Point', type: 'textarea', required: true },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface ConvexExecutionPanelProps {
  onRoadmapGenerated?: (roadmap: ExecutionRoadmap) => void;
}

export function ConvexExecutionPanel({ onRoadmapGenerated }: ConvexExecutionPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<ExecutionRoadmap | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(0);

  // Handle template selection
  const handleSelectTemplate = (template: TemplateMetadata) => {
    setSelectedTemplate(template);
    setVariables({});
    setError(null);
    logger.info(`[CONVEX-EXEC] Selected template: ${template.name}`);
  };

  // Handle variable input change
  const handleVariableChange = (varName: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [varName]: value,
    }));
  };

  // Generate roadmap
  const handleGenerateRoadmap = async () => {
    if (!selectedTemplate) {
      setError('Please select a template first');
      return;
    }

    // Validate required variables
    const missingVars = selectedTemplate.variables
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.name);

    if (missingVars.length > 0) {
      setError(`Missing required fields: ${missingVars.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    logger.info(`[CONVEX-EXEC] Generating roadmap for ${selectedTemplate.name}`);

    try {
      const response = await fetch('/api/convex/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          templateType: selectedTemplate.type,
          estimatedDuration: selectedTemplate.estimatedDuration,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }

      const data = await response.json();
      setRoadmap(data);
      logger.info('[CONVEX-EXEC] Roadmap generated successfully');

      if (onRoadmapGenerated) {
        onRoadmapGenerated(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('[CONVEX-EXEC] Roadmap generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy task list to clipboard
  const handleCopyTasks = () => {
    if (!roadmap) return;

    const taskList = roadmap.milestones
      .flatMap((m) => m.tasks)
      .map((t) => `[ ] ${t.title} (${t.estimatedHours}h)`)
      .join('\n');

    navigator.clipboard.writeText(taskList);
    logger.info('[CONVEX-EXEC] Task list copied to clipboard');
  };

  // Export roadmap as JSON
  const handleExportRoadmap = () => {
    if (!roadmap) return;

    const exportData = JSON.stringify(roadmap, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convex-roadmap-${roadmap.templateId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logger.info('[CONVEX-EXEC] Roadmap exported');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Show template selection
  if (!selectedTemplate || !roadmap) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            CONVEX Execution Roadmap
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a template and generate your personalized implementation roadmap
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Template Grid */}
        {!selectedTemplate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <p className="font-semibold">{template.estimatedDuration}h</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Expected Result:</span>
                      <p className="font-semibold text-sm">{template.expectedResults}</p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                    className="w-full mt-2"
                  >
                    Select Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template Input Form */}
        {selectedTemplate && !roadmap && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <CardDescription>Fill in the details to generate your roadmap</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setVariables({});
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {variable.name} {variable.required && <span className="text-red-600">*</span>}
                  </label>

                  {variable.type === 'text' && (
                    <Input
                      placeholder={`Enter ${variable.name.toLowerCase()}`}
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  )}

                  {variable.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={`Enter ${variable.name.toLowerCase()}`}
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  )}

                  {variable.type === 'textarea' && (
                    <Textarea
                      placeholder={`Enter ${variable.name.toLowerCase()}`}
                      value={variables[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700"
                      rows={3}
                    />
                  )}

                  {variable.type === 'select' && variable.options && (
                    <Select
                      value={variables[variable.name] || ''}
                      onValueChange={(value) => handleVariableChange(variable.name, value)}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder={`Select ${variable.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {variable.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <Button
                onClick={handleGenerateRoadmap}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Roadmap...
                  </>
                ) : (
                  'Generate Execution Roadmap'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show roadmap
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {roadmap.templateName} Roadmap
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {roadmap.totalDuration} weeks • {roadmap.milestones.length} milestones
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setRoadmap(null);
            setSelectedTemplate(null);
            setVariables({});
          }}
        >
          Start Over
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="text-2xl font-bold text-blue-600">{roadmap.overallProgress}%</span>
            </div>
            <Progress value={roadmap.overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {roadmap.milestones.map((milestone, idx) => (
          <Card
            key={idx}
            className={`cursor-pointer transition-all dark:bg-gray-900 dark:border-gray-800 ${
              expandedMilestone === idx ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setExpandedMilestone(expandedMilestone === idx ? null : idx)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {milestone.completionPercentage === 100 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Week {milestone.week}: {milestone.title}
                    </CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {milestone.objectives.map((obj, oidx) => (
                        <Badge key={oidx} variant="outline" className="text-xs">
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{milestone.completionPercentage}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">complete</div>
                  {expandedMilestone === idx ? (
                    <ChevronUp className="h-5 w-5 mx-auto mt-1" />
                  ) : (
                    <ChevronDown className="h-5 w-5 mx-auto mt-1" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedMilestone === idx && (
              <CardContent className="border-t dark:border-gray-700 space-y-4 pt-4">
                {/* Tasks */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Tasks</h4>
                  <ul className="space-y-2">
                    {milestone.tasks.map((task) => (
                      <li key={task.id} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          readOnly
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{task.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {task.estimatedHours}h
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                          {task.successCriteria.length > 0 && (
                            <div className="mt-2 text-xs space-y-1">
                              {task.successCriteria.map((criterion, cidx) => (
                                <div key={cidx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <div className="h-1 w-1 bg-gray-600 rounded-full" />
                                  {criterion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Success Metrics */}
                {milestone.successMetrics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Success Metrics</h4>
                    <ul className="space-y-1">
                      {milestone.successMetrics.map((metric, midx) => (
                        <li key={midx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Target className="h-4 w-4 text-blue-600" />
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Risk Factors */}
      {roadmap.riskFactors.length > 0 && (
        <Card className="border-2 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {roadmap.riskFactors.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="h-2 w-2 bg-orange-600 rounded-full mt-1.5 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Support Resources */}
      {roadmap.supportResources.length > 0 && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Support Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {roadmap.supportResources.map((resource, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="h-2 w-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  {resource}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={handleCopyTasks}
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Tasks
        </Button>
        <Button
          variant="outline"
          onClick={handleExportRoadmap}
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button
          onClick={() => {
            setRoadmap(null);
            setSelectedTemplate(null);
            setVariables({});
          }}
        >
          Create New Roadmap
        </Button>
      </div>
    </div>
  );
}

export default ConvexExecutionPanel;
