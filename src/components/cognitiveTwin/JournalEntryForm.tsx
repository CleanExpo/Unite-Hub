/**
 * Journal Entry Form - Cognitive Twin
 *
 * Journal entry creation form with rich text editor,
 * mood selector, AI prompt suggestions, and save draft/publish functionality.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Badge from "@/components/ui/badge";
import {
  Smile,
  Meh,
  Frown,
  Sparkles,
  Save,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Tag,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

type MoodType = "great" | "good" | "neutral" | "low" | "stressed";

interface MoodOption {
  value: MoodType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface AIPrompt {
  id: string;
  text: string;
  category: string;
}

interface JournalEntryFormProps {
  onSaveDraft?: (entry: JournalEntry) => Promise<void>;
  onPublish?: (entry: JournalEntry) => Promise<void>;
  onGeneratePrompts?: (mood: MoodType, tags: string[]) => Promise<AIPrompt[]>;
  initialEntry?: Partial<JournalEntry>;
  isLoading?: boolean;
}

export interface JournalEntry {
  title: string;
  content: string;
  mood: MoodType;
  tags: string[];
  is_draft: boolean;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    value: "great",
    label: "Great",
    icon: <Smile className="w-5 h-5" />,
    color: "text-green-500 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
  },
  {
    value: "good",
    label: "Good",
    icon: <Smile className="w-5 h-5" />,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  },
  {
    value: "neutral",
    label: "Neutral",
    icon: <Meh className="w-5 h-5" />,
    color: "text-gray-500 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800",
  },
  {
    value: "low",
    label: "Low",
    icon: <Frown className="w-5 h-5" />,
    color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
  },
  {
    value: "stressed",
    label: "Stressed",
    icon: <Frown className="w-5 h-5" />,
    color: "text-red-500 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  },
];

export default function JournalEntryForm({
  onSaveDraft,
  onPublish,
  onGeneratePrompts,
  initialEntry,
  isLoading = false,
}: JournalEntryFormProps) {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || "neutral");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formatting tools state (basic rich text)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isList, setIsList] = useState(false);

  // Character count
  const charCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  // Load AI prompts when mood or tags change
  useEffect(() => {
    if (onGeneratePrompts && (mood !== "neutral" || tags.length > 0)) {
      loadPrompts();
    }
  }, [mood, tags]);

  const loadPrompts = async () => {
    if (!onGeneratePrompts) return;

    setLoadingPrompts(true);
    try {
      const prompts = await onGeneratePrompts(mood, tags);
      setAiPrompts(prompts);
    } catch (err) {
      console.error("Failed to load prompts:", err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  // Add tag
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Handle key press in tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Apply prompt to content
  const applyPrompt = (promptText: string) => {
    if (content.trim()) {
      setContent(content + "\n\n" + promptText);
    } else {
      setContent(promptText);
    }
  };

  // Basic formatting functions
  const applyFormatting = (type: "bold" | "italic" | "list") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = content;
    let newCursorPos = end;

    if (type === "bold") {
      newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
      newCursorPos = end + 4;
    } else if (type === "italic") {
      newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
      newCursorPos = end + 2;
    } else if (type === "list") {
      const lines = selectedText.split("\n");
      const formattedLines = lines.map(line => line.trim() ? `- ${line}` : line).join("\n");
      newText = content.substring(0, start) + formattedLines + content.substring(end);
      newCursorPos = end + (formattedLines.length - selectedText.length);
    }

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Validate form
  const isFormValid = () => {
    return title.trim().length > 0 && content.trim().length > 0;
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!isFormValid() || !onSaveDraft) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await onSaveDraft({
        title: title.trim(),
        content: content.trim(),
        mood,
        tags,
        is_draft: true,
      });
      setSuccess("Draft saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!isFormValid() || !onPublish) return;

    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      await onPublish({
        title: title.trim(),
        content: content.trim(),
        mood,
        tags,
        is_draft: false,
      });
      setSuccess("Entry published successfully");

      // Reset form after 2 seconds
      setTimeout(() => {
        setTitle("");
        setContent("");
        setMood("neutral");
        setTags([]);
        setAiPrompts([]);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish entry");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              New Journal Entry
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title */}
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
            />

            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How are you feeling?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMood(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      mood === option.value
                        ? option.color
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div className={mood === option.value ? "" : "text-gray-400"}>
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => applyFormatting("bold")}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-bold transition-colors",
                    isBold
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-200 dark:hover:bg-gray-800"
                  )}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => applyFormatting("italic")}
                  className={cn(
                    "px-3 py-1 rounded text-sm italic transition-colors",
                    isItalic
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-200 dark:hover:bg-gray-800"
                  )}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => applyFormatting("list")}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    isList
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-200 dark:hover:bg-gray-800"
                  )}
                  title="Bullet List"
                >
                  •
                </button>
                <div className="ml-auto text-xs text-gray-500">
                  {wordCount} words • {charCount} characters
                </div>
              </div>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={12}
                className="resize-none rounded-t-none"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleAddTag} icon={<Tag className="w-4 h-4" />}>
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-950"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                loading={saving}
                disabled={!isFormValid() || saving || publishing}
                icon={<Save className="w-4 h-4" />}
                className="flex-1"
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                loading={publishing}
                disabled={!isFormValid() || saving || publishing}
                icon={<Send className="w-4 h-4" />}
                className="flex-1"
              >
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Prompt Suggestions */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Prompts
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Suggestions based on your mood and tags
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingPrompts ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : aiPrompts.length > 0 ? (
              aiPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => applyPrompt(prompt.text)}
                  className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {prompt.category}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-900 dark:group-hover:text-purple-100">
                        {prompt.text}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No prompts yet</p>
                <p className="text-xs mt-1">
                  Select a mood or add tags to get AI suggestions
                </p>
              </div>
            )}

            {onGeneratePrompts && !loadingPrompts && (
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                onClick={loadPrompts}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Refresh Prompts
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Writing Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Writing Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Be honest and authentic with your feelings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Use formatting to organize your thoughts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Add tags to track themes over time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Save drafts to continue writing later</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
