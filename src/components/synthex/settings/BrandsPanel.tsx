'use client';

/**
 * Brands Panel Component
 * Phase B39: White-Label & Multi-Brand Settings
 *
 * Manage multiple brands for white-label configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Palette,
  Plus,
  Star,
  Globe,
  Mail,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle,
  Image,
} from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  sending_domain?: string;
  custom_domain?: string;
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  is_default: boolean;
  is_active: boolean;
}

interface BrandsPanelProps {
  tenantId: string;
}

export default function BrandsPanel({ tenantId }: BrandsPanelProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    primary_color: '#ff6b35',
    secondary_color: '#1a1a2e',
    accent_color: '#f39c12',
    text_color: '#ffffff',
    background_color: '#0f0f1a',
    logo_url: '',
    logo_dark_url: '',
    favicon_url: '',
    sending_domain: '',
    custom_domain: '',
    from_name: '',
    from_email: '',
    reply_to_email: '',
    is_default: false,
  });

  useEffect(() => {
    fetchBrands();
  }, [tenantId]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/synthex/brands?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.brands) {
        setBrands(data.brands);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      primary_color: '#ff6b35',
      secondary_color: '#1a1a2e',
      accent_color: '#f39c12',
      text_color: '#ffffff',
      background_color: '#0f0f1a',
      logo_url: '',
      logo_dark_url: '',
      favicon_url: '',
      sending_domain: '',
      custom_domain: '',
      from_name: '',
      from_email: '',
      reply_to_email: '',
      is_default: false,
    });
    setEditingBrand(null);
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      accent_color: brand.accent_color,
      text_color: brand.text_color,
      background_color: brand.background_color,
      logo_url: brand.logo_url || '',
      logo_dark_url: brand.logo_dark_url || '',
      favicon_url: brand.favicon_url || '',
      sending_domain: brand.sending_domain || '',
      custom_domain: brand.custom_domain || '',
      from_name: brand.from_name || '',
      from_email: brand.from_email || '',
      reply_to_email: brand.reply_to_email || '',
      is_default: brand.is_default,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
return;
}

    setSaving(true);
    try {
      if (editingBrand) {
        // Update existing brand
        await fetch(`/api/synthex/brands/${editingBrand.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, ...formData }),
        });
      } else {
        // Create new brand
        await fetch('/api/synthex/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, ...formData }),
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchBrands();
    } catch (error) {
      console.error('Failed to save brand:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) {
return;
}

    try {
      await fetch(`/api/synthex/brands/${brandId}?tenantId=${tenantId}`, {
        method: 'DELETE',
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to delete brand:', error);
    }
  };

  const setAsDefault = async (brandId: string) => {
    try {
      await fetch(`/api/synthex/brands/${brandId}/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to set default brand:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-12 flex justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Palette className="h-5 w-5 text-orange-500" />
                Brand Management
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Configure white-label branding for your campaigns
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
resetForm();
}
            }}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-100">
                    {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Configure brand colors, logos, and email settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Brand Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Brand"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="my-brand"
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brand description..."
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Brand Colors
                    </Label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { key: 'primary_color', label: 'Primary' },
                        { key: 'secondary_color', label: 'Secondary' },
                        { key: 'accent_color', label: 'Accent' },
                        { key: 'text_color', label: 'Text' },
                        { key: 'background_color', label: 'Background' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs text-gray-400">{label}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData[key as keyof typeof formData] as string}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                            <Input
                              value={formData[key as keyof typeof formData] as string}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-gray-100 text-xs h-8"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Logos */}
                  <div className="space-y-3">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Brand Assets
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Logo URL</Label>
                        <Input
                          value={formData.logo_url}
                          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Logo (Dark)</Label>
                        <Input
                          value={formData.logo_dark_url}
                          onChange={(e) => setFormData({ ...formData, logo_dark_url: e.target.value })}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Favicon</Label>
                        <Input
                          value={formData.favicon_url}
                          onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Domains */}
                  <div className="space-y-3">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Custom Domains
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Sending Domain</Label>
                        <Input
                          value={formData.sending_domain}
                          onChange={(e) => setFormData({ ...formData, sending_domain: e.target.value })}
                          placeholder="mail.yourdomain.com"
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Custom Domain</Label>
                        <Input
                          value={formData.custom_domain}
                          onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                          placeholder="brand.yourdomain.com"
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Settings */}
                  <div className="space-y-3">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Settings
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">From Name</Label>
                        <Input
                          value={formData.from_name}
                          onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                          placeholder="Your Brand"
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">From Email</Label>
                        <Input
                          value={formData.from_email}
                          onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                          placeholder="hello@yourdomain.com"
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Reply-To</Label>
                        <Input
                          value={formData.reply_to_email}
                          onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                          placeholder="support@yourdomain.com"
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !formData.name.trim()}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No brands configured</h3>
              <p className="text-gray-500 mb-4">
                Create your first brand to enable white-label campaigns
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-10 h-10 rounded object-contain bg-gray-900"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center"
                          style={{ backgroundColor: brand.primary_color }}
                        >
                          <span className="text-white font-bold">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-100">{brand.name}</h4>
                          {brand.is_default && (
                            <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{brand.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!brand.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAsDefault(brand.id)}
                          className="text-gray-400 hover:text-orange-400"
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(brand)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!brand.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(brand.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="flex gap-1 mt-3">
                    {[
                      brand.primary_color,
                      brand.secondary_color,
                      brand.accent_color,
                      brand.text_color,
                      brand.background_color,
                    ].map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded border border-gray-700"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Domain Info */}
                  {(brand.custom_domain || brand.sending_domain) && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {brand.custom_domain && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {brand.custom_domain}
                        </span>
                      )}
                      {brand.sending_domain && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {brand.sending_domain}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
