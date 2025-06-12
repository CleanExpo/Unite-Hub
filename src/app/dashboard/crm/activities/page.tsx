'use client';

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Filter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">Track all your CRM activities and interactions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Activity
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search activities..."
                className="pl-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="call">Phone Calls</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="week">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Your team&apos;s latest interactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Sample activities */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Meeting with ABC Corp</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Discussed quarterly goals and project timeline
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Follow-up call completed</p>
                  <p className="text-sm text-muted-foreground">5 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Client confirmed interest in premium package
                </p>
              </div>
            </div>

            {/* Empty state message */}
            <div className="text-center py-8 text-muted-foreground">
              <p>Activities will appear here once logged</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
