'use client';

import { useState, useEffect } from 'react';
import { ActivityItem } from '@/components/crm/ActivityItem';
import { createClient } from '@/utils/supabase/client';
import { ActivityLog } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();
  const pageSize = 20;

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = supabase
        .from('crm_activity_log')
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          created_at,
          profiles (email, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (entityTypeFilter) {
        query = query.eq('entity_type', entityTypeFilter);
      }
      
      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      
      if (searchQuery) {
        query = query.or(`profiles.email.ilike.%${searchQuery}%,entity_id.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map to include user details in each activity
      const newActivities = data.map(activity => ({
        ...activity,
        user: activity.profiles
      })) as ActivityLog[];
      
      // Append or replace activities based on page
      setActivities(prev => page === 1 ? newActivities : [...prev, ...newActivities]);
      setHasMore(newActivities.length === pageSize);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, entityTypeFilter, actionFilter, searchQuery]);

  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filters change
  };

  if (loading && page === 1) {
    return <div className="p-4 text-center">Loading activities...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search by email or ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
        />
        
        <Select
          value={entityTypeFilter}
          onValueChange={(value) => {
            setEntityTypeFilter(value);
            handleFilterChange();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="clients">Clients</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="tasks">Tasks</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value);
            handleFilterChange();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline"
          onClick={handleFilterChange}
        >
          Apply Filters
        </Button>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="p-4 text-center">No activities found</div>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Activities'}
          </Button>
        </div>
      )}
    </div>
  );
}
