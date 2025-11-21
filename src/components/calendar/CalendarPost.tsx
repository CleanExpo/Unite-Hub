"use client";

import React from "react";
import {
  Calendar,
  Hash,
  Image,
  Clock,
  Target,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  Edit,
} from "lucide-react";

// Content calendar post type (migrated from Convex)
interface ContentCalendarPost {
  _id: string;
  platform: string;
  postType: string;
  contentPillar: string;
  scheduledDate: string;
  bestTimeToPost?: string;
  suggestedCopy: string;
  suggestedHashtags: string[];
  suggestedImagePrompt?: string;
  callToAction?: string;
  targetAudience?: string;
  aiReasoning?: string;
  status: "suggested" | "approved" | "scheduled" | "published";
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface CalendarPostProps {
  post: ContentCalendarPost;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export default function CalendarPost({
  post,
  onApprove,
  onRegenerate,
  onEdit,
}: CalendarPostProps) {
  const statusColors = {
    suggested: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800",
    published: "bg-purple-100 text-purple-800",
  };

  const platformColors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    blog: "#6B7280",
    email: "#8B5CF6",
  };

  const postDate = new Date(post.scheduledDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: platformColors[post.platform] }}
          />
          <span className="font-medium text-gray-900 capitalize">
            {post.platform}
          </span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[post.status]
          }`}
        >
          {post.status}
        </span>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Calendar className="h-4 w-4" />
        <span>{postDate.toLocaleDateString()}</span>
        {post.bestTimeToPost && (
          <>
            <Clock className="h-4 w-4 ml-2" />
            <span>{post.bestTimeToPost}</span>
          </>
        )}
      </div>

      {/* Post Type and Content Pillar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {post.postType}
        </span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
          {post.contentPillar}
        </span>
      </div>

      {/* Post Copy */}
      <div className="mb-3">
        <p className="text-gray-800 text-sm line-clamp-3">
          {post.suggestedCopy}
        </p>
      </div>

      {/* Hashtags */}
      {post.suggestedHashtags.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Hash className="h-4 w-4 text-gray-400" />
          {post.suggestedHashtags.slice(0, 3).map((hashtag, index) => (
            <span key={index} className="text-xs text-blue-600">
              #{hashtag}
            </span>
          ))}
          {post.suggestedHashtags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{post.suggestedHashtags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Image Prompt */}
      {post.suggestedImagePrompt && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded text-xs">
          <Image className="h-4 w-4 text-gray-500 mt-0.5" />
          <p className="text-gray-600 line-clamp-2">
            {post.suggestedImagePrompt}
          </p>
        </div>
      )}

      {/* CTA */}
      {post.callToAction && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">CTA: {post.callToAction}</span>
        </div>
      )}

      {/* Target Audience */}
      {post.targetAudience && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <Target className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">{post.targetAudience}</span>
        </div>
      )}

      {/* AI Reasoning (collapsible) */}
      <details className="mb-3">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          AI Reasoning
        </summary>
        <p className="text-xs text-gray-600 mt-2 pl-4 border-l-2 border-gray-200">
          {post.aiReasoning}
        </p>
      </details>

      {/* Engagement Metrics (if published) */}
      {post.engagement && (
        <div className="flex items-center gap-4 mb-3 p-2 bg-green-50 rounded text-xs">
          <span className="text-gray-700">
            ❤️ {post.engagement.likes}
          </span>
          <span className="text-gray-700">
            💬 {post.engagement.comments}
          </span>
          <span className="text-gray-700">
            🔄 {post.engagement.shares}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        {post.status === "suggested" && onApprove && (
          <button
            onClick={onApprove}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
