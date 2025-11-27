/**
 * Framework Component Editor
 *
 * Manages reusable framework components with:
 * - Create/edit/delete components
 * - Component type templates (input, section, rule, pattern, metric)
 * - Drag-and-drop component arrangement
 * - Component validation
 * - Reusability and sharing across frameworks
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { logger } from '@/lib/logging';

type ComponentType = 'input' | 'section' | 'rule' | 'pattern' | 'metric';

interface FrameworkComponent {
  id: string;
  name: string;
  description: string;
  type: ComponentType;
  schema: Record<string, any>;
  template?: string;
  reusable: boolean;
  shared: boolean;
  order: number;
  usageCount: number;
  createdAt: string;
}

interface FrameworkComponentEditorProps {
  workspaceId: string;
  frameworkId: string;
  components: FrameworkComponent[];
  isOpen: boolean;
  onClose: () => void;
  onComponentsUpdate: (components: FrameworkComponent[]) => void;
}

const COMPONENT_TYPES: Record<ComponentType, { label: string; description: string }> = {
  input: {
    label: 'Input Field',
    description: 'User input or data field',
  },
  section: {
    label: 'Section',
    description: 'Grouping of related components',
  },
  rule: {
    label: 'Business Rule',
    description: 'Conditional logic or decision rule',
  },
  pattern: {
    label: 'Pattern',
    description: 'Recurring element or best practice',
  },
  metric: {
    label: 'Metric',
    description: 'Measurement or KPI',
  },
};

const COMPONENT_TEMPLATES: Record<ComponentType, Record<string, any>> = {
  input: {
    label: '',
    placeholder: '',
    required: false,
    type: 'text',
  },
  section: {
    title: '',
    description: '',
    items: [],
  },
  rule: {
    condition: '',
    action: '',
    priority: 'medium',
  },
  pattern: {
    name: '',
    context: '',
    implementation: '',
  },
  metric: {
    name: '',
    formula: '',
    unit: '',
    target: 0,
  },
};

export function FrameworkComponentEditor({
  workspaceId,
  frameworkId,
  components: initialComponents,
  isOpen,
  onClose,
  onComponentsUpdate,
}: FrameworkComponentEditorProps) {
  // State
  const [components, setComponents] = useState<FrameworkComponent[]>(initialComponents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ComponentType>('input');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schema: COMPONENT_TEMPLATES.input,
    reusable: false,
    shared: false,
  });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      schema: COMPONENT_TEMPLATES.input,
      reusable: false,
      shared: false,
    });
    setSelectedType('input');
    setEditingId(null);
  }, []);

  // Handle type change
  const handleTypeChange = (type: ComponentType) => {
    setSelectedType(type);
    setFormData((prev) => ({
      ...prev,
      schema: COMPONENT_TEMPLATES[type],
    }));
  };

  // Update schema field
  const updateSchemaField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        [field]: value,
      },
    }));
  };

  // Save component
  const handleSaveComponent = async () => {
    try {
      setSaving(true);

      if (editingId) {
        // Update existing component
        setComponents((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  name: formData.name,
                  description: formData.description,
                  schema: formData.schema,
                  reusable: formData.reusable,
                  shared: formData.shared,
                }
              : c
          )
        );
      } else {
        // Create new component
        const newComponent: FrameworkComponent = {
          id: `comp_${Date.now()}`,
          name: formData.name,
          description: formData.description,
          type: selectedType,
          schema: formData.schema,
          reusable: formData.reusable,
          shared: formData.shared,
          order: components.length,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        };
        setComponents((prev) => [...prev, newComponent]);
      }

      resetForm();
      setShowNewDialog(false);
    } catch (error) {
      logger.error('[COMPONENT_EDITOR] Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete component
  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  // Duplicate component
  const handleDuplicateComponent = (component: FrameworkComponent) => {
    const newComponent: FrameworkComponent = {
      ...component,
      id: `comp_${Date.now()}`,
      name: `${component.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  // Reorder components
  const handleMoveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex((c) => c.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === components.length - 1)
    ) {
      return;
    }

    const newComponents = [...components];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newComponents[index], newComponents[swapIndex]] = [
      newComponents[swapIndex],
      newComponents[index],
    ];

    // Update order values
    newComponents.forEach((c, i) => (c.order = i));
    setComponents(newComponents);
  };

  // Save all components
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      onComponentsUpdate(components);
      // Close after successful save
      setTimeout(() => onClose(), 500);
    } catch (error) {
      logger.error('[COMPONENT_EDITOR] Save all error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Edit component
  const handleEditComponent = (component: FrameworkComponent) => {
    setFormData({
      name: component.name,
      description: component.description,
      schema: component.schema,
      reusable: component.reusable,
      shared: component.shared,
    });
    setSelectedType(component.type);
    setEditingId(component.id);
    setShowNewDialog(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle>Framework Components</SheetTitle>
            <SheetDescription>
              Manage reusable components for your framework
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Add Button */}
            <Button
              onClick={() => {
                resetForm();
                setShowNewDialog(true);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>

            {/* Components List */}
            <ScrollArea className="h-[600px] border rounded-lg p-4">
              {components.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No components yet
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((component, index) => (
                    <div
                      key={component.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === component.id ? null : component.id
                              )
                            }
                            className="flex items-center gap-2 font-semibold text-sm hover:opacity-70 transition-opacity"
                          >
                            {expandedId === component.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            {component.name}
                          </button>
                          <div className="text-xs text-muted-foreground mt-1">
                            {component.description}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {COMPONENT_TYPES[component.type].label}
                        </Badge>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        {component.reusable && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Reusable
                          </Badge>
                        )}
                        {component.shared && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Shared
                          </Badge>
                        )}
                        {component.usageCount > 0 && (
                          <Badge variant="secondary">
                            Used {component.usageCount}x
                          </Badge>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedId === component.id && (
                        <>
                          <Separator className="my-2" />
                          <div className="space-y-2 text-sm">
                            <div>
                              <div className="font-semibold text-xs text-muted-foreground">
                                Schema
                              </div>
                              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                {JSON.stringify(component.schema, null, 2)}
                              </pre>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  Created:
                                </span>
                                <span className="ml-1">
                                  {new Date(component.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Type:
                                </span>
                                <span className="ml-1">{component.type}</span>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-2" />
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveComponent(component.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < components.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveComponent(component.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateComponent(component)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditComponent(component)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComponent(component.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Summary */}
            <div className="text-xs text-muted-foreground">
              {components.length} component{components.length !== 1 ? 's' : ''} •{' '}
              {components.filter((c) => c.reusable).length} reusable
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Components'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* New/Edit Component Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Component' : 'New Component'}
            </DialogTitle>
            <DialogDescription>
              Create or edit a framework component
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Component Name</Label>
              <Input
                placeholder="e.g., Brand Value Proposition"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this component does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Component Type</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPONENT_TYPES).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      {label} – {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schema Fields */}
            <div className="space-y-3 border-t pt-4">
              <Label className="font-semibold">Schema Configuration</Label>
              {Object.entries(formData.schema).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </Label>
                  {typeof value === 'boolean' ? (
                    <select
                      value={value ? 'true' : 'false'}
                      onChange={(e) =>
                        updateSchemaField(key, e.target.value === 'true')
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="false">False</option>
                      <option value="true">True</option>
                    </select>
                  ) : typeof value === 'number' ? (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateSchemaField(key, parseFloat(e.target.value))
                      }
                    />
                  ) : (
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => updateSchemaField(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="space-y-2 border-t pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.reusable}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reusable: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm">Mark as reusable</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.shared}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shared: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm">Share with team</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveComponent} disabled={saving}>
              {saving ? 'Saving...' : 'Save Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
