"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, TrendingUp } from "lucide-react";

interface HashtagSuggesterProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  suggestions?: string[];
  maxHashtags?: number;
}

export function HashtagSuggester({
  hashtags,
  onChange,
  suggestions = [],
  maxHashtags = 30,
}: HashtagSuggesterProps) {
  const [input, setInput] = useState("");

  const addHashtag = (tag: string) => {
    const cleaned = tag.replace(/^#/, "").trim();
    if (cleaned && !hashtags.includes(cleaned) && hashtags.length < maxHashtags) {
      onChange([...hashtags, cleaned]);
    }
    setInput("");
  };

  const removeHashtag = (tag: string) => {
    onChange(hashtags.filter((t) => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag(input);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add hashtag..."
          className="flex-1"
        />
        <Button
          onClick={() => addHashtag(input)}
          disabled={!input || hashtags.length >= maxHashtags}
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              #{tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => removeHashtag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="text-xs text-gray-600">
        {hashtags.length} / {maxHashtags} hashtags
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Trending Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !hashtags.includes(s))
              .slice(0, 10)
              .map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => addHashtag(tag)}
                >
                  #{tag}
                  <Plus className="h-3 w-3 ml-1" />
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
