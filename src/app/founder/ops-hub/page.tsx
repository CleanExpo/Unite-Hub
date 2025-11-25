'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFounderEvents } from '@/lib/founder/founderEventLog';
import { getApprovalQueue, getApprovalStats } from '@/lib/founder/founderApprovalEngine';
import { getActiveBrands } from '@/lib/brands/brandRegistry';

export default function FounderOpsHubPage() {
  const events = getFounderEvents({ limit: 20 });
  const approvalQueue = getApprovalQueue();
  const approvalStats = getApprovalStats();
  const activeBrands = getActiveBrands();

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Founder Ops Hub</h1>
        <p className="text-gray-600">
          Oversight, truth layer enforcement, risk scoring, approval workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{approvalStats.totalPending}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting founder decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {approvalStats.byCriticalityLevel.critical}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brands Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeBrands.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {approvalQueue.length === 0 ? (
            <p className="text-gray-600">No pending approvals</p>
          ) : (
            <div className="space-y-2">
              {approvalQueue.map((req) => (
                <div key={req.id} className="border rounded p-3">
                  <p className="font-medium">{req.summary}</p>
                  <p className="text-sm text-gray-600">
                    {req.createdByAgent} | {req.itemType}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-600">No events</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="border rounded p-2 text-sm">
                  <p className="font-medium">{event.event}</p>
                  <p className="text-xs text-gray-600">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
