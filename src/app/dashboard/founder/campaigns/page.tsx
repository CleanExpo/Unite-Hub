'use client';

/**
 * Founder Campaigns Dashboard
 * Main campaigns page with blueprint feed, filters, matrix view, and creation flow
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignBlueprintCard } from '@/components/campaigns/CampaignBlueprintCard';
import { CampaignChannelMatrix } from '@/components/campaigns/CampaignChannelMatrix';
import { CampaignDetailedView } from '@/components/campaigns/CampaignDetailedView';
import { Plus, Search, Filter, LayoutGrid, LayoutList, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function CampaignsPage() {
  const { toast } = useToast();
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [filteredBlueprints, setFilteredBlueprints] = useState<any[]>([]);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending_review: 0,
    approved: 0,
    high_priority: 0,
  });

  useEffect(() => {
    if (workspaceId) {
      fetchBlueprints();
      fetchAvailableChannels();
    }
  }, [workspaceId]);

  useEffect(() => {
    applyFilters();
  }, [blueprints, searchQuery, brandFilter, statusFilter]);

  const fetchBlueprints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId: workspaceId! });
      if (brandFilter !== 'all') params.append('brandSlug', brandFilter);
      if (statusFilter !== 'all') params.append('approvalStatus', statusFilter);

      const response = await fetch(`/api/campaigns/blueprints?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to fetch blueprints');

      const data = await response.json();
      setBlueprints(data.blueprints || []);

      // Calculate stats
      const total = data.blueprints.length;
      const pending_review = data.blueprints.filter(
        (b: any) => b.approval_status === 'pending_review'
      ).length;
      const approved = data.blueprints.filter((b: any) => b.approval_status === 'approved').length;
      const high_priority = data.blueprints.filter((b: any) => b.priority_score >= 7).length;

      setStats({ total, pending_review, approved, high_priority });
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign blueprints',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableChannels = async () => {
    try {
      const response = await fetch(
        `/api/campaigns/channels?workspaceId=${workspaceId}&brandSlug=${brandFilter !== 'all' ? brandFilter : 'unite_group'}`
      );

      if (!response.ok) throw new Error('Failed to fetch channels');

      const data = await response.json();
      setAvailableChannels(data.playbook_channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...blueprints];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.blueprint_title?.toLowerCase().includes(query) ||
          b.topic_title?.toLowerCase().includes(query) ||
          b.topic_keywords?.some((k: string) => k.toLowerCase().includes(query))
      );
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter((b) => b.brand_slug === brandFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.approval_status === statusFilter);
    }

    setFilteredBlueprints(filtered);
  };

  const handleViewBlueprint = (blueprintId: string) => {
    setSelectedBlueprintId(blueprintId);
    setDetailViewOpen(true);
  };

  const handleApproveBlueprint = async (blueprintId: string, channel?: string) => {
    toast({
      title: channel ? 'Channel Approved' : 'Blueprint Approved',
      description: channel
        ? `${channel.replace(/_/g, ' ')} has been approved`
        : 'All channels have been approved',
    });

    await fetchBlueprints();
  };

  const handleChannelClick = (blueprintId: string, channel: string) => {
    setSelectedBlueprintId(blueprintId);
    setDetailViewOpen(true);
  };

  const brandOptions = [
    { value: 'all', label: 'All Brands' },
    { value: 'unite_group', label: 'Unite Group' },
    { value: 'aussie_stainless', label: 'Aussie Stainless' },
    { value: 'rp_tech', label: 'R&P Tech' },
    { value: 'bne_glass_pool_fencing', label: 'BNE Glass Pool Fencing' },
    { value: 'ultra_chrome', label: 'Ultra Chrome' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'partially_approved', label: 'Partially Approved' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Blueprints</h1>
          <p className="text-muted-foreground mt-1">
            Multi-channel campaign planning and approval
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Blueprint
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Blueprints</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.high_priority}</div>
            <p className="text-xs text-muted-foreground mt-1">Priority Score ≥ 7.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search blueprints, topics, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('matrix')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading blueprints...</div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlueprints.length > 0 ? (
            filteredBlueprints.map((blueprint) => (
              <CampaignBlueprintCard
                key={blueprint.id}
                blueprint={blueprint}
                onView={handleViewBlueprint}
                onApprove={handleApproveBlueprint}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No blueprints found matching your filters
            </div>
          )}
        </div>
      ) : (
        <CampaignChannelMatrix
          blueprints={filteredBlueprints}
          availableChannels={availableChannels}
          onChannelClick={handleChannelClick}
          onBlueprintClick={handleViewBlueprint}
        />
      )}

      {/* Detailed View Modal */}
      <CampaignDetailedView
        blueprintId={selectedBlueprintId}
        workspaceId={workspaceId || ''}
        isOpen={detailViewOpen}
        onClose={() => {
          setDetailViewOpen(false);
          setSelectedBlueprintId(null);
        }}
        onApprove={handleApproveBlueprint}
      />
    </div>
  );
}
