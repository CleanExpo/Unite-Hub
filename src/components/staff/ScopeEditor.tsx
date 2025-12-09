'use client';

/**
 * ScopeEditor Component
 * Phase 3 Step 2 - Staff Tools
 *
 * Interactive scope editing component for staff to review and modify
 * AI-generated proposal scopes before sending to clients.
 *
 * Features:
 * - Edit scope sections (Problem, Objectives, Deliverables)
 * - Edit Good/Better/Best packages
 * - Inline pricing calculations
 * - Real-time preview
 *
 * Following CLAUDE.md patterns:
 * - Client component ('use client')
 * - TypeScript strict typing
 * - shadcn/ui components
 * - Toast notifications for feedback
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pencil, Check, X, Plus, Trash2, Sparkles } from 'lucide-react';
import { type ProposalScope, type ScopeSection, type ScopePackage, calculatePackagePricing } from '@/lib/projects/scope-planner';
import { useToast } from '@/contexts/ToastContext';

interface ScopeEditorProps {
  scope: ProposalScope;
  onChange: (scope: ProposalScope) => void;
  loading?: boolean;
  isAIGenerated?: boolean; // Phase 3 Step 4: Flag to show AI badge
}

export function ScopeEditor({ scope, onChange, loading = false, isAIGenerated = false }: ScopeEditorProps) {
  const toast = useToast();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);

  // Section editing
  function handleUpdateSection(sectionId: string, updates: Partial<ScopeSection>) {
    const updatedSections = scope.sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    onChange({
      ...scope,
      sections: updatedSections,
    });

    setEditingSection(null);
    toast.success('Section updated');
  }

  function handleAddSection() {
    const newSection: ScopeSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: 'Add section description here...',
      order: scope.sections.length + 1,
    };

    onChange({
      ...scope,
      sections: [...scope.sections, newSection],
    });

    setEditingSection(newSection.id);
    toast.success('Section added');
  }

  function handleDeleteSection(sectionId: string) {
    if (!confirm('Delete this section?')) {
return;
}

    onChange({
      ...scope,
      sections: scope.sections.filter((s) => s.id !== sectionId),
    });

    toast.success('Section deleted');
  }

  // Package editing
  function handleUpdatePackage(packageId: string, updates: Partial<ScopePackage>) {
    const updatedPackages = scope.packages.map((pkg) =>
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );

    onChange({
      ...scope,
      packages: updatedPackages,
    });

    setEditingPackage(null);
    toast.success('Package updated');
  }

  function handleCalculatePricing(packageId: string, hours: number) {
    const pricing = calculatePackagePricing(hours);

    const updatedPackages = scope.packages.map((pkg) =>
      pkg.id === packageId
        ? {
            ...pkg,
            estimatedHours: hours,
            priceMin: pricing.priceMin,
            priceMax: pricing.priceMax,
          }
        : pkg
    );

    onChange({
      ...scope,
      packages: updatedPackages,
    });

    toast.success('Pricing calculated');
  }

  function handleAddDeliverable(packageId: string) {
    const updatedPackages = scope.packages.map((pkg) =>
      pkg.id === packageId
        ? {
            ...pkg,
            deliverables: [...(pkg.deliverables || []), 'New deliverable'],
          }
        : pkg
    );

    onChange({
      ...scope,
      packages: updatedPackages,
    });
  }

  function handleUpdateDeliverable(packageId: string, index: number, value: string) {
    const updatedPackages = scope.packages.map((pkg) =>
      pkg.id === packageId
        ? {
            ...pkg,
            deliverables: pkg.deliverables?.map((d, i) => (i === index ? value : d)),
          }
        : pkg
    );

    onChange({
      ...scope,
      packages: updatedPackages,
    });
  }

  function handleDeleteDeliverable(packageId: string, index: number) {
    const updatedPackages = scope.packages.map((pkg) =>
      pkg.id === packageId
        ? {
            ...pkg,
            deliverables: pkg.deliverables?.filter((_, i) => i !== index),
          }
        : pkg
    );

    onChange({
      ...scope,
      packages: updatedPackages,
    });
  }

  return (
    <div className="space-y-6">
      {/* Scope Sections */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">Scope Sections</CardTitle>
                {isAIGenerated && (
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-400">
                Edit project overview, objectives, deliverables, and assumptions
              </CardDescription>
            </div>
            <Button
              onClick={handleAddSection}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {scope.sections.map((section) => (
            <div key={section.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              {editingSection === section.id ? (
                <SectionEditForm
                  section={section}
                  onSave={(updates) => handleUpdateSection(section.id, updates)}
                  onCancel={() => setEditingSection(null)}
                />
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingSection(section.id)}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteSection(section.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{section.description}</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing Packages */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Pricing Packages</CardTitle>
          <CardDescription className="text-slate-400">
            Edit Good/Better/Best packages with deliverables and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="better" className="space-y-4">
            <TabsList className="bg-slate-900/50 border border-slate-700">
              {scope.packages.map((pkg) => (
                <TabsTrigger
                  key={pkg.id}
                  value={pkg.tier}
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  {pkg.label}
                  {pkg.tier === 'better' && <Badge className="ml-2 bg-blue-600">Recommended</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {scope.packages.map((pkg) => (
              <TabsContent key={pkg.id} value={pkg.tier} className="space-y-4">
                <PackageEditForm
                  package={pkg}
                  isEditing={editingPackage === pkg.id}
                  onEdit={() => setEditingPackage(pkg.id)}
                  onSave={(updates) => handleUpdatePackage(pkg.id, updates)}
                  onCancel={() => setEditingPackage(null)}
                  onCalculatePricing={(hours) => handleCalculatePricing(pkg.id, hours)}
                  onAddDeliverable={() => handleAddDeliverable(pkg.id)}
                  onUpdateDeliverable={(index, value) => handleUpdateDeliverable(pkg.id, index, value)}
                  onDeleteDeliverable={(index) => handleDeleteDeliverable(pkg.id, index)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Section Edit Form Component
function SectionEditForm({
  section,
  onSave,
  onCancel,
}: {
  section: ScopeSection;
  onSave: (updates: Partial<ScopeSection>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Section Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white mt-1"
          placeholder="e.g., Project Overview"
        />
      </div>
      <div>
        <Label className="text-slate-300">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
          placeholder="Detailed section content..."
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel} size="sm" variant="outline" className="border-slate-600 text-slate-300">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ title, description })}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}

// Package Edit Form Component
function PackageEditForm({
  package: pkg,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onCalculatePricing,
  onAddDeliverable,
  onUpdateDeliverable,
  onDeleteDeliverable,
}: {
  package: ScopePackage;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<ScopePackage>) => void;
  onCancel: () => void;
  onCalculatePricing: (hours: number) => void;
  onAddDeliverable: () => void;
  onUpdateDeliverable: (index: number, value: string) => void;
  onDeleteDeliverable: (index: number) => void;
}) {
  const [summary, setSummary] = useState(pkg.summary);
  const [timeline, setTimeline] = useState(pkg.timeline || '');
  const [estimatedHours, setEstimatedHours] = useState(pkg.estimatedHours?.toString() || '');

  if (!isEditing) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{pkg.summary}</h3>
            {pkg.timeline && <p className="text-sm text-slate-400">Timeline: {pkg.timeline}</p>}
          </div>
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Deliverables:</h4>
            <ul className="space-y-2">
              {pkg.deliverables?.map((deliverable, index) => (
                <li key={index} className="flex items-center text-slate-300 text-sm">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>

          {(pkg.priceMin || pkg.priceMax) && (
            <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated Cost:</span>
                <span className="text-2xl font-bold text-white">
                  ${pkg.priceMin?.toLocaleString()} - ${pkg.priceMax?.toLocaleString()}
                </span>
              </div>
              {pkg.estimatedHours && (
                <p className="text-sm text-slate-500 text-right mt-1">
                  {pkg.estimatedHours} hours estimated
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
      <div>
        <Label className="text-slate-300">Summary</Label>
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white mt-1"
          placeholder="One-sentence package description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Timeline</Label>
          <Input
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white mt-1"
            placeholder="e.g., 6-8 weeks"
          />
        </div>
        <div>
          <Label className="text-slate-300">Estimated Hours</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              placeholder="40"
            />
            <Button
              onClick={() => onCalculatePricing(parseInt(estimatedHours) || 0)}
              size="sm"
              disabled={!estimatedHours}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Calculate
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-slate-300">Deliverables</Label>
          <Button
            onClick={onAddDeliverable}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {pkg.deliverables?.map((deliverable, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={deliverable}
                onChange={(e) => onUpdateDeliverable(index, e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="Deliverable description"
              />
              <Button
                onClick={() => onDeleteDeliverable(index)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {(pkg.priceMin || pkg.priceMax) && (
        <div className="pt-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Calculated Cost:</span>
            <span className="text-xl font-bold text-white">
              ${pkg.priceMin?.toLocaleString()} - ${pkg.priceMax?.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button onClick={onCancel} size="sm" variant="outline" className="border-slate-600 text-slate-300">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ summary, timeline: timeline || undefined })}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
