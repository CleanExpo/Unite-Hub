"use client";

import React from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
} from "lucide-react";

interface CalendarStatsProps {
  stats: {
    totalPosts: number;
    publishedPosts: number;
    approvedPosts: number;
    suggestedPosts: number;
    platformBreakdown: Record<string, number>;
    postTypeBreakdown: Record<string, number>;
    totalEngagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    avgEngagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    hasEngagementData: boolean;
  };
}

export default function CalendarStats({ stats }: CalendarStatsProps) {
  const platformColors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    blog: "#6B7280",
    email: "#8B5CF6",
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publishedPosts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedPosts}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suggestedPosts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Platform Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
            <div key={platform}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 capitalize">{platform}</span>
                <span className="text-sm font-medium text-gray-900">{count} posts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(count / stats.totalPosts) * 100}%`,
                    backgroundColor: platformColors[platform] || "#6B7280",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Type Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Content Type Mix</h3>
        <div className="space-y-2">
          {Object.entries(stats.postTypeBreakdown).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize">{type.replace(/_/g, " ")}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{count}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round((count / stats.totalPosts) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Stats */}
      {stats.hasEngagementData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Average Engagement</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-700">Likes</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(stats.avgEngagement.likes)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-700">Comments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(stats.avgEngagement.comments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-700">Shares</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(stats.avgEngagement.shares)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  stats.totalEngagement.likes +
                    stats.totalEngagement.comments +
                    stats.totalEngagement.shares
                )}
              </p>
              <p className="text-xs text-gray-600">Total Engagement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
