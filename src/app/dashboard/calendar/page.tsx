"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar as CalendarIcon,
  Filter,
  Sparkles,
  Grid3x3,
  List,
  TrendingUp,
} from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import CalendarPost from "@/components/calendar/CalendarPost";
import PostDetailsModal from "@/components/calendar/PostDetailsModal";
import PlatformFilter from "@/components/calendar/PlatformFilter";
import CalendarStats from "@/components/calendar/CalendarStats";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";

export default function ContentCalendarPage() {
  return (
    <FeaturePageWrapper
      featureName="Content Calendar"
      description="AI-powered 30-day content calendar with strategic recommendations"
      icon={<CalendarIcon className="h-20 w-20 text-slate-600" />}
    >
      {(clientId) => <ContentCalendarFeature clientId={clientId} />}
    </FeaturePageWrapper>
  );
}

function ContentCalendarFeature({ clientId }: { clientId: Id<"clients"> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "facebook",
    "instagram",
    "linkedin",
    "tiktok",
    "blog",
    "email",
  ]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const calendarPosts = useQuery(api.contentCalendar.getCalendarPosts, {
    clientId,
    month: currentMonth,
    year: currentYear,
  });

  const calendarStats = useQuery(api.contentCalendar.getCalendarStats, {
    clientId,
  });

  const performanceStats = useQuery(api.contentCalendar.analyzePerformance, {
    clientId,
  });

  // Mutations
  const approvePost = useMutation(api.contentCalendar.approvePost);
  const updatePost = useMutation(api.contentCalendar.updatePost);

  // Filter posts by selected platforms
  const filteredPosts = calendarPosts?.filter((post) =>
    selectedPlatforms.includes(post.platform)
  );

  const handleGenerateCalendar = async () => {
    setIsGenerating(true);
    try {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const response = await fetch("/api/calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          platforms: selectedPlatforms,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate calendar");

      const data = await response.json();
      alert(`Successfully generated ${data.postsCreated} posts!`);
    } catch (error) {
      console.error("Error generating calendar:", error);
      alert("Failed to generate calendar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await approvePost({ postId: postId as Id<"contentCalendarPosts"> });
    } catch (error) {
      console.error("Error approving post:", error);
      alert("Failed to approve post");
    }
  };

  const handleRegeneratePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/calendar/${postId}/regenerate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to regenerate post");

      alert("Post regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating post:", error);
      alert("Failed to regenerate post");
    }
  };

  const handleUpdatePost = async (postId: string, updates: any) => {
    try {
      await updatePost({
        postId: postId as Id<"contentCalendarPosts">,
        ...updates,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                Content Calendar
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered 30-day content calendar with strategic recommendations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>

              <button
                onClick={handleGenerateCalendar}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Calendar"}
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "calendar"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="col-span-3 space-y-4">
              <PlatformFilter
                selectedPlatforms={selectedPlatforms}
                onTogglePlatform={handleTogglePlatform}
              />

              {performanceStats && <CalendarStats stats={performanceStats} />}
            </div>
          )}

          {/* Calendar/List View */}
          <div className={showFilters ? "col-span-9" : "col-span-12"}>
            {viewMode === "calendar" ? (
              <CalendarView
                posts={filteredPosts || []}
                onPostClick={handlePostClick}
                onApprove={handleApprovePost}
                onRegenerate={handleRegeneratePost}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={(month, year) => {
                  setCurrentMonth(month);
                  setCurrentYear(year);
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredPosts?.map((post) => (
                  <CalendarPost
                    key={post._id}
                    post={post}
                    onApprove={() => handleApprovePost(post._id)}
                    onRegenerate={() => handleRegeneratePost(post._id)}
                    onEdit={() => handlePostClick(post)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {(!filteredPosts || filteredPosts.length === 0) && (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Posts Scheduled
                </h3>
                <p className="text-gray-600 mb-6">
                  Generate your first AI-powered content calendar to get started
                </p>
                <button
                  onClick={handleGenerateCalendar}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-5 w-5" />
                  {isGenerating ? "Generating..." : "Generate Calendar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Stats Summary (when filters hidden) */}
        {!showFilters && calendarStats && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calendarStats.totalPosts}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calendarStats.upcomingPosts}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calendarStats.byStatus.approved}
                  </p>
                </div>
                <div className="text-3xl">✓</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platforms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calendarStats.platforms.length}
                  </p>
                </div>
                <div className="text-3xl">📱</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPost(null);
          }}
          onApprove={() => handleApprovePost(selectedPost._id)}
          onRegenerate={() => handleRegeneratePost(selectedPost._id)}
          onUpdate={(updates) => handleUpdatePost(selectedPost._id, updates)}
        />
      )}
    </div>
  );
}
