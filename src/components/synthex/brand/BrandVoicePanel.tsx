'use client';

/**
 * Brand Voice Settings Panel
 * Phase B19: UI for configuring brand voice profiles
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  RefreshCw,
  Star,
  Volume2,
  MessageSquare,
  Target,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

// Types
interface BrandVoice {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  brandName: string;
  tagline: string | null;
  missionStatement: string | null;
  formalityLevel: number;
  humorLevel: number;
  enthusiasmLevel: number;
  empathyLevel: number;
  technicalLevel: number;
  toneKeywords: string[];
  avoidKeywords: string[];
  preferredSentenceLength: string;
  useContractions: boolean;
  useEmoji: boolean;
  useExclamation: boolean;
  firstPerson: string;
  audienceDescription: string | null;
  audiencePainPoints: string[];
  audienceGoals: string[];
  sampleGreetings: string[];
  sampleClosings: string[];
  sampleParagraphs: string[];
  dos: string[];
  donts: string[];
  industry: string | null;
  competitors: string[];
  differentiators: string[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  className?: string;
}

const defaultVoice: Partial<BrandVoice> = {
  name: 'New Brand Voice',
  isDefault: false,
  isActive: true,
  brandName: '',
  tagline: '',
  missionStatement: '',
  formalityLevel: 5,
  humorLevel: 3,
  enthusiasmLevel: 5,
  empathyLevel: 7,
  technicalLevel: 5,
  toneKeywords: [],
  avoidKeywords: [],
  preferredSentenceLength: 'medium',
  useContractions: true,
  useEmoji: false,
  useExclamation: true,
  firstPerson: 'we',
  audienceDescription: '',
  audiencePainPoints: [],
  audienceGoals: [],
  sampleGreetings: [],
  sampleClosings: [],
  sampleParagraphs: [],
  dos: [],
  donts: [],
  industry: '',
  competitors: [],
  differentiators: [],
};

export default function BrandVoicePanel({ className = '' }: Props) {
  const { tenantId, loading: tenantLoading } = useSynthexTenant();

  // State
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<BrandVoice | null>(null);
  const [editingVoice, setEditingVoice] = useState<Partial<BrandVoice> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Array input helpers
  const [newToneKeyword, setNewToneKeyword] = useState('');
  const [newAvoidKeyword, setNewAvoidKeyword] = useState('');
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');

  // Fetch voices
  const fetchVoices = useCallback(async () => {
    if (!tenantId) {
return;
}
    setLoading(true);
    try {
      const res = await fetch(`/api/synthex/brand/voice?tenantId=${tenantId}&activeOnly=false`);
      const data = await res.json();
      if (data.status === 'ok') {
        setVoices(data.voices || []);
        if (data.voices?.length > 0 && !selectedVoice) {
          setSelectedVoice(data.voices[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch brand voices:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedVoice]);

  useEffect(() => {
    if (tenantId) {
      fetchVoices();
    }
  }, [tenantId, fetchVoices]);

  // Open dialog to create new voice
  const handleCreateNew = () => {
    setEditingVoice({ ...defaultVoice });
    setIsNew(true);
    setIsDialogOpen(true);
  };

  // Open dialog to edit voice
  const handleEdit = (voice: BrandVoice) => {
    setEditingVoice({ ...voice });
    setIsNew(false);
    setIsDialogOpen(true);
  };

  // Save voice
  const handleSave = async () => {
    if (!tenantId || !editingVoice) {
return;
}

    if (!editingVoice.brandName) {
      alert('Brand name is required');
      return;
    }

    setSaving(true);
    try {
      const endpoint = '/api/synthex/brand/voice';
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          voiceId: isNew ? undefined : editingVoice.id,
          ...editingVoice,
        }),
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setIsDialogOpen(false);
        setEditingVoice(null);
        fetchVoices();
        if (data.voice) {
          setSelectedVoice(data.voice);
        }
      } else {
        alert(`Failed to save: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save brand voice:', error);
      alert('Failed to save brand voice');
    } finally {
      setSaving(false);
    }
  };

  // Delete voice
  const handleDelete = async (voice: BrandVoice) => {
    if (!tenantId) {
return;
}
    if (!confirm(`Delete "${voice.name}"? This cannot be undone.`)) {
return;
}

    try {
      const res = await fetch(
        `/api/synthex/brand/voice?tenantId=${tenantId}&voiceId=${voice.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.status === 'ok') {
        if (selectedVoice?.id === voice.id) {
          setSelectedVoice(null);
        }
        fetchVoices();
      }
    } catch (error) {
      console.error('Failed to delete brand voice:', error);
    }
  };

  // Helper to add to array
  const addToArray = (key: keyof BrandVoice, value: string, setter: (val: string) => void) => {
    if (!value.trim() || !editingVoice) {
return;
}
    const currentArray = (editingVoice[key] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      setEditingVoice({
        ...editingVoice,
        [key]: [...currentArray, value.trim()],
      });
    }
    setter('');
  };

  // Helper to remove from array
  const removeFromArray = (key: keyof BrandVoice, value: string) => {
    if (!editingVoice) {
return;
}
    const currentArray = (editingVoice[key] as string[]) || [];
    setEditingVoice({
      ...editingVoice,
      [key]: currentArray.filter((v) => v !== value),
    });
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Please select a Synthex tenant to configure brand voice.</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Palette className="h-5 w-5 text-orange-500" />
            Brand Voice
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure your brand's voice and tone for AI-generated content
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          New Voice Profile
        </Button>
      </div>

      {/* Voice List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : voices.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <Palette className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Brand Voice Configured</h3>
          <p className="text-gray-400 mb-4">
            Create a brand voice profile to ensure AI-generated content matches your brand's tone and style.
          </p>
          <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Create First Voice Profile
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={`bg-gray-900 rounded-lg p-4 border transition-colors cursor-pointer ${
                selectedVoice?.id === voice.id
                  ? 'border-orange-500'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => setSelectedVoice(voice)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{voice.name}</h3>
                    {voice.isDefault && (
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{voice.brandName}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(voice);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(voice);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {voice.tagline && (
                <p className="text-sm text-gray-500 italic mb-3">"{voice.tagline}"</p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {voice.toneKeywords.slice(0, 3).map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
                {voice.toneKeywords.length > 3 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{voice.toneKeywords.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Formal</div>
                  <div className="text-white">{voice.formalityLevel}/10</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Humor</div>
                  <div className="text-white">{voice.humorLevel}/10</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Energy</div>
                  <div className="text-white">{voice.enthusiasmLevel}/10</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Empathy</div>
                  <div className="text-white">{voice.empathyLevel}/10</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Tech</div>
                  <div className="text-white">{voice.technicalLevel}/10</div>
                </div>
              </div>

              {!voice.isActive && (
                <Badge variant="outline" className="mt-2 text-yellow-500 border-yellow-500/50">
                  Inactive
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isNew ? 'Create Brand Voice' : 'Edit Brand Voice'}
            </DialogTitle>
            <DialogDescription>
              Configure how your brand communicates with customers
            </DialogDescription>
          </DialogHeader>

          {editingVoice && (
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-900">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
              </TabsList>

              {/* Identity Tab */}
              <TabsContent value="identity" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Profile Name</Label>
                    <Input
                      value={editingVoice.name || ''}
                      onChange={(e) =>
                        setEditingVoice({ ...editingVoice, name: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                      placeholder="e.g., Main Brand Voice"
                    />
                  </div>
                  <div>
                    <Label>Brand Name *</Label>
                    <Input
                      value={editingVoice.brandName || ''}
                      onChange={(e) =>
                        setEditingVoice({ ...editingVoice, brandName: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                      placeholder="Your brand name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={editingVoice.tagline || ''}
                    onChange={(e) =>
                      setEditingVoice({ ...editingVoice, tagline: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="Your brand's tagline"
                  />
                </div>

                <div>
                  <Label>Mission Statement</Label>
                  <Textarea
                    value={editingVoice.missionStatement || ''}
                    onChange={(e) =>
                      setEditingVoice({ ...editingVoice, missionStatement: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="What does your brand stand for?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    <Input
                      value={editingVoice.industry || ''}
                      onChange={(e) =>
                        setEditingVoice({ ...editingVoice, industry: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700"
                      placeholder="e.g., SaaS, Healthcare, Retail"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingVoice.isDefault || false}
                        onCheckedChange={(checked) =>
                          setEditingVoice({ ...editingVoice, isDefault: checked })
                        }
                      />
                      <Label>Set as Default</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingVoice.isActive !== false}
                        onCheckedChange={(checked) =>
                          setEditingVoice({ ...editingVoice, isActive: checked })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Voice Tab */}
              <TabsContent value="voice" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4" />
                      Formality Level ({editingVoice.formalityLevel}/10)
                    </Label>
                    <Slider
                      value={[editingVoice.formalityLevel || 5]}
                      onValueChange={([val]) =>
                        setEditingVoice({ ...editingVoice, formalityLevel: val })
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Casual</span>
                      <span>Very Formal</span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Humor Level ({editingVoice.humorLevel}/10)</Label>
                    <Slider
                      value={[editingVoice.humorLevel || 3]}
                      onValueChange={([val]) =>
                        setEditingVoice({ ...editingVoice, humorLevel: val })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Serious</span>
                      <span>Playful</span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Enthusiasm Level ({editingVoice.enthusiasmLevel}/10)
                    </Label>
                    <Slider
                      value={[editingVoice.enthusiasmLevel || 5]}
                      onValueChange={([val]) =>
                        setEditingVoice({ ...editingVoice, enthusiasmLevel: val })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Calm</span>
                      <span>Energetic</span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Empathy Level ({editingVoice.empathyLevel}/10)</Label>
                    <Slider
                      value={[editingVoice.empathyLevel || 7]}
                      onValueChange={([val]) =>
                        setEditingVoice({ ...editingVoice, empathyLevel: val })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Direct</span>
                      <span>Empathetic</span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Technical Level ({editingVoice.technicalLevel}/10)
                    </Label>
                    <Slider
                      value={[editingVoice.technicalLevel || 5]}
                      onValueChange={([val]) =>
                        setEditingVoice({ ...editingVoice, technicalLevel: val })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Simple</span>
                      <span>Technical</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 mt-4">
                  <Label className="mb-2 block">Tone Keywords</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newToneKeyword}
                      onChange={(e) => setNewToneKeyword(e.target.value)}
                      className="bg-gray-900 border-gray-700"
                      placeholder="e.g., friendly, professional"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('toneKeywords', newToneKeyword, setNewToneKeyword);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('toneKeywords', newToneKeyword, setNewToneKeyword)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editingVoice.toneKeywords || []).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-gray-800">
                        {kw}
                        <button
                          onClick={() => removeFromArray('toneKeywords', kw)}
                          className="ml-1 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Sentence Length</Label>
                    <Select
                      value={editingVoice.preferredSentenceLength || 'medium'}
                      onValueChange={(val) =>
                        setEditingVoice({ ...editingVoice, preferredSentenceLength: val })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>First Person</Label>
                    <Select
                      value={editingVoice.firstPerson || 'we'}
                      onValueChange={(val) =>
                        setEditingVoice({ ...editingVoice, firstPerson: val })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="we">We</SelectItem>
                        <SelectItem value="I">I</SelectItem>
                        <SelectItem value="the team">The Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingVoice.useContractions !== false}
                        onCheckedChange={(checked) =>
                          setEditingVoice({ ...editingVoice, useContractions: checked })
                        }
                      />
                      <Label className="text-sm">Use Contractions</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingVoice.useEmoji || false}
                        onCheckedChange={(checked) =>
                          setEditingVoice({ ...editingVoice, useEmoji: checked })
                        }
                      />
                      <Label className="text-sm">Use Emoji</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Audience Tab */}
              <TabsContent value="audience" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    Audience Description
                  </Label>
                  <Textarea
                    value={editingVoice.audienceDescription || ''}
                    onChange={(e) =>
                      setEditingVoice({ ...editingVoice, audienceDescription: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="Describe your target audience..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Audience Pain Points</Label>
                  <Textarea
                    value={(editingVoice.audiencePainPoints || []).join('\n')}
                    onChange={(e) =>
                      setEditingVoice({
                        ...editingVoice,
                        audiencePainPoints: e.target.value.split('\n').filter((l) => l.trim()),
                      })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="One pain point per line..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Audience Goals</Label>
                  <Textarea
                    value={(editingVoice.audienceGoals || []).join('\n')}
                    onChange={(e) =>
                      setEditingVoice({
                        ...editingVoice,
                        audienceGoals: e.target.value.split('\n').filter((l) => l.trim()),
                      })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="One goal per line..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Key Differentiators</Label>
                  <Textarea
                    value={(editingVoice.differentiators || []).join('\n')}
                    onChange={(e) =>
                      setEditingVoice({
                        ...editingVoice,
                        differentiators: e.target.value.split('\n').filter((l) => l.trim()),
                      })
                    }
                    className="bg-gray-900 border-gray-700"
                    placeholder="What makes you different? One per line..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Rules Tab */}
              <TabsContent value="rules" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Do's
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newDo}
                      onChange={(e) => setNewDo(e.target.value)}
                      className="bg-gray-900 border-gray-700"
                      placeholder="Add a 'do' rule..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('dos', newDo, setNewDo);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('dos', newDo, setNewDo)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {(editingVoice.dos || []).map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-green-900/20 rounded px-2 py-1 text-sm"
                      >
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="flex-1">{d}</span>
                        <button
                          onClick={() => removeFromArray('dos', d)}
                          className="hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <X className="h-4 w-4 text-red-500" />
                    Don'ts
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newDont}
                      onChange={(e) => setNewDont(e.target.value)}
                      className="bg-gray-900 border-gray-700"
                      placeholder="Add a 'don't' rule..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('donts', newDont, setNewDont);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('donts', newDont, setNewDont)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {(editingVoice.donts || []).map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-red-900/20 rounded px-2 py-1 text-sm"
                      >
                        <X className="h-3 w-3 text-red-500" />
                        <span className="flex-1">{d}</span>
                        <button
                          onClick={() => removeFromArray('donts', d)}
                          className="hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Words/Phrases to Avoid
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newAvoidKeyword}
                      onChange={(e) => setNewAvoidKeyword(e.target.value)}
                      className="bg-gray-900 border-gray-700"
                      placeholder="Add word to avoid..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('avoidKeywords', newAvoidKeyword, setNewAvoidKeyword);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addToArray('avoidKeywords', newAvoidKeyword, setNewAvoidKeyword)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editingVoice.avoidKeywords || []).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-red-900/20 text-red-300">
                        {kw}
                        <button
                          onClick={() => removeFromArray('avoidKeywords', kw)}
                          className="ml-1 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isNew ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
