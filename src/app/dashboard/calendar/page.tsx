"use client";

import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";
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
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { CalendarSkeleton, CalendarPostListSkeleton } from "@/components/skeletons/CalendarSkeleton";

interface CalendarPost {
  id: string;
  platform: string;
  content: string;
  scheduledDate: string;
  status: string;
  approved: boolean;
}

interface CalendarStatsData {
  totalPosts: number;
  upcomingPosts: number;
  byStatus: {
    approved: number;
    pending: number;
    draft: number;
  };
  platforms: string[];
}

interface PerformanceStats {
  engagement: number;
  reach: number;
  clicks: number;
}

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

function ContentCalendarFeature({ clientId }: { clientId: string }) {
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
  const [error, setError] = useState<string | null>(null);

  // State for data fetching
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[] | undefined>(undefined);
  const [calendarStats, setCalendarStats] = useState<CalendarStatsData | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);

  // Fetch calendar posts
  useEffect(() => {
    const fetchCalendarPosts = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(
          `/api/calendar/posts?clientId=${clientId}&month=${currentMonth}&year=${currentYear}`,
          {
            headers: { "Authorization": `Bearer ${session.access_token}` }
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCalendarPosts(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching calendar posts:", error);
        setError("Failed to load calendar posts");
      }
    };

    fetchCalendarPosts();
  }, [clientId, currentMonth, currentYear]);

  // Fetch calendar stats
  useEffect(() => {
    const fetchCalendarStats = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/calendar/stats?clientId=${clientId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setCalendarStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching calendar stats:", error);
      }
    };

    fetchCalendarStats();
  }, [clientId]);

  // Fetch performance stats
  useEffect(() => {
    const fetchPerformanceStats = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      try {
        const response = await fetch(`/api/calendar/performance?clientId=${clientId}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setPerformanceStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching performance stats:", error);
      }
    };

    fetchPerformanceStats();
  }, [clientId]);

  // Filter posts by selected platforms
  const filteredPosts = calendarPosts?.filter((post) =>
    selectedPlatforms.includes(post.platform)
  );

  const handleGenerateCalendar = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setIsGenerating(false);
        return;
      }

      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const response = await fetch("/api/calendar/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          platforms: selectedPlatforms,
        }),
      });

      if (!response.ok) {
throw new Error("Failed to generate calendar");
}

      const data = await response.json();
      alert(`Successfully generated ${data.postsCreated} posts!`);

      // Refresh posts
      const refreshResponse = await fetch(
        `/api/calendar/posts?clientId=${clientId}&month=${currentMonth}&year=${currentYear}`,
        {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        }
      );
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        setCalendarPosts(result.data || []);
      }
    } catch (error: any) {
      console.error("Error generating calendar:", error);
      setError(error.message || "Failed to generate calendar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/calendar/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        // Update local state
        setCalendarPosts(prev =>
          prev?.map(post =>
            post.id === postId ? { ...post, approved: true, status: "approved" } : post
          )
        );
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Error approving post:", error);
      alert("Failed to approve post");
    }
  };

  const handleRegeneratePost = async (postId: string) => {
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/calendar/posts/${postId}/regenerate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
throw new Error("Failed to regenerate post");
}

      alert("Post regenerated successfully!");

      // Refresh posts
      const refreshResponse = await fetch(
        `/api/calendar/posts?clientId=${clientId}&month=${currentMonth}&year=${currentYear}`,
        {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        }
      );
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        setCalendarPosts(result.data || []);
      }
    } catch (error) {
      console.error("Error regenerating post:", error);
      alert("Failed to regenerate post");
    }
  };

  const handleUpdatePost = async (postId: string, updates: any) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch(`/api/calendar/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Update local state
        setCalendarPosts(prev =>
          prev?.map(post =>
            post.id === postId ? { ...post, ...updates } : post
          )
        );
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }
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

  // Loading state
  const isLoading = calendarPosts === undefined;
  const hasError = error !== null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Calendar" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Content Calendar
          </h1>
          <p className="text-slate-400">
            AI-powered 30-day content calendar with strategic recommendations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              showFilters
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <button
            onClick={handleGenerateCalendar}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50 transition-all disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Calendar"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <ErrorState
          title="Failed to load calendar"
          message={error || "An unexpected error occurred"}
          onRetry={() => {
            setError(null);
            window.location.reload();
          }}
        />
      )}

      {/* View Mode Toggle */}
      {!hasError && (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            viewMode === "calendar"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
          Calendar View
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            viewMode === "list"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50"
          }`}
        >
          <List className="h-4 w-4" />
          List View
        </button>
      </div>
      )}

      {/* Main Content */}
      {!hasError && (
        <>
        {isLoading ? (
          <>
            {viewMode === "calendar" ? (
              <CalendarSkeleton />
            ) : (
              <CalendarPostListSkeleton count={5} />
            )}
          </>
        ) : (
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
                    key={post.id}
                    post={post}
                    onApprove={() => handleApprovePost(post.id)}
                    onRegenerate={() => handleRegeneratePost(post.id)}
                    onEdit={() => handlePostClick(post)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {(!filteredPosts || filteredPosts.length === 0) && (
              <EmptyState
                icon={CalendarIcon}
                title="No Posts Scheduled"
                description="Generate your first AI-powered content calendar to get started"
                actionLabel={isGenerating ? "Generating..." : "Generate Calendar"}
                onAction={handleGenerateCalendar}
              />
            )}
          </div>
        </div>
        )}
        </>
      )}

      {/* Calendar Stats Summary (when filters hidden) */}
      {!hasError && !isLoading && !showFilters && calendarStats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Posts</p>
                <p className="text-2xl font-bold text-white">
                  {calendarStats.totalPosts}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Upcoming</p>
                <p className="text-2xl font-bold text-white">
                  {calendarStats.upcomingPosts}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Approved</p>
                <p className="text-2xl font-bold text-white">
                  {calendarStats.byStatus.approved}
                </p>
              </div>
              <div className="text-3xl group-hover:scale-110 transition-transform">&#10003;</div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Platforms</p>
                <p className="text-2xl font-bold text-white">
                  {calendarStats.platforms.length}
                </p>
              </div>
              <div className="text-3xl group-hover:scale-110 transition-transform">&#128241;</div>
            </div>
          </div>
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPost(null);
          }}
          onApprove={() => handleApprovePost(selectedPost.id)}
          onRegenerate={() => handleRegeneratePost(selectedPost.id)}
          onUpdate={(updates) => handleUpdatePost(selectedPost.id, updates)}
        />
      )}
    </div>
  );
}
