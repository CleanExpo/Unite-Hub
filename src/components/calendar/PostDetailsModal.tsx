"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Hash,
  Image as ImageIcon,
  Clock,
  Target,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  Copy,
  Wand2,
} from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

interface PostDetailsModalProps {
  post: Doc<"contentCalendarPosts">;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onRegenerate: () => void;
  onUpdate: (updates: Partial<Doc<"contentCalendarPosts">>) => void;
}

export default function PostDetailsModal({
  post,
  isOpen,
  onClose,
  onApprove,
  onRegenerate,
  onUpdate,
}: PostDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCopy, setEditedCopy] = useState(post.suggestedCopy);
  const [editedHashtags, setEditedHashtags] = useState(
    post.suggestedHashtags.join(", ")
  );
  const [editedImagePrompt, setEditedImagePrompt] = useState(
    post.suggestedImagePrompt || ""
  );
  const [editedCTA, setEditedCTA] = useState(post.callToAction || "");

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate({
      suggestedCopy: editedCopy,
      suggestedHashtags: editedHashtags.split(",").map((h) => h.trim()),
      suggestedImagePrompt: editedImagePrompt || undefined,
      callToAction: editedCTA || undefined,
    });
    setIsEditing(false);
  };

  const handleCopyCopy = () => {
    navigator.clipboard.writeText(post.suggestedCopy);
  };

  const handleCopyHashtags = () => {
    const hashtagsText = post.suggestedHashtags.map((h) => `#${h}`).join(" ");
    navigator.clipboard.writeText(hashtagsText);
  };

  const postDate = new Date(post.scheduledDate);

  const platformColors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
    blog: "#6B7280",
    email: "#8B5CF6",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: platformColors[post.platform] }}
            />
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {post.platform} Post
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {postDate.toLocaleDateString()} {postDate.toLocaleTimeString()}
              </span>
            </div>
            {post.bestTimeToPost && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{post.bestTimeToPost}</span>
              </div>
            )}
          </div>

          {/* Post Type and Pillar */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {post.postType}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
              {post.contentPillar}
            </span>
            <span
              className={`px-3 py-1 text-sm rounded-full ${
                post.status === "suggested"
                  ? "bg-yellow-100 text-yellow-800"
                  : post.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : post.status === "scheduled"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {post.status}
            </span>
          </div>

          {/* Post Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Post Copy
              </label>
              {!isEditing && (
                <button
                  onClick={handleCopyCopy}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedCopy}
                onChange={(e) => setEditedCopy(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {post.suggestedCopy}
                </p>
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hashtags
              </label>
              {!isEditing && (
                <button
                  onClick={handleCopyHashtags}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
                placeholder="hashtag1, hashtag2, hashtag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {post.suggestedHashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    #{hashtag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image Prompt */}
          {(post.suggestedImagePrompt || isEditing) && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4" />
                Image Concept (DALL-E Prompt)
              </label>
              {isEditing ? (
                <textarea
                  value={editedImagePrompt}
                  onChange={(e) => setEditedImagePrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe the image concept..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    {post.suggestedImagePrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          {(post.callToAction || isEditing) && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Call to Action
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCTA}
                  onChange={(e) => setEditedCTA(e.target.value)}
                  placeholder="e.g., Shop Now, Learn More, Sign Up"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-700 text-sm font-medium">
                    {post.callToAction}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Target Audience */}
          {post.targetAudience && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Target Audience
              </label>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-gray-700 text-sm">{post.targetAudience}</p>
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4" />
              AI Strategic Reasoning
            </label>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-gray-700 text-sm">{post.aiReasoning}</p>
            </div>
          </div>

          {/* Engagement Metrics */}
          {post.engagement && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Engagement Metrics
              </label>
              <div className="flex gap-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {post.engagement.likes}
                  </div>
                  <div className="text-xs text-gray-600">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {post.engagement.comments}
                  </div>
                  <div className="text-xs text-gray-600">Comments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {post.engagement.shares}
                  </div>
                  <div className="text-xs text-gray-600">Shares</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {post.status === "suggested" && !isEditing && (
              <button
                onClick={onApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Post
              </button>
            )}
            {!isEditing && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate with AI
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
