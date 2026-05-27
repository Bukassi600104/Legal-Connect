"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { useAuth } from "@/components/providers/auth-provider";
import { POST_CATEGORY_LABELS } from "@/lib/constants";
import { getPremiumLimits } from "@/lib/feature-gate";
import type { PostCategory } from "@/types";

interface ComposeBoxProps {
  onPostCreated?: () => void;
}

export function ComposeBox({ onPostCreated }: ComposeBoxProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory | "">("");
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!profile) return null;

  const limits = getPremiumLimits(profile.is_premium ?? false);
  const charLimit = limits.charLimit;

  const handlePost = async () => {
    if (!content.trim() || posting || content.length > charLimit) return;

    setPosting(true);
    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          category: category || "general",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Post creation failed");
      }

      setContent("");
      setCategory("");
      setExpanded(false);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="border-b border-border-custom px-4 pt-3 pb-2">
      <div className="flex gap-3">
        {/* Avatar */}
        {profile.avatar_url ? (
          <OptimizedAvatar
            src={profile.avatar_url}
            alt={profile.full_name}
            className="size-10"
          />
        ) : (
          <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
            {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Text input — X-style borderless */}
          <textarea
            placeholder="What's happening in law?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (!expanded && e.target.value) setExpanded(true);
            }}
            onFocus={() => setExpanded(true)}
            className="w-full min-h-[52px] resize-none border-0 bg-transparent p-0 text-xl placeholder:text-muted-text placeholder:text-xl focus:outline-none focus:ring-0"
            rows={expanded ? 3 : 1}
          />

          {expanded && (
            <>
              {/* Audience selector — X-style */}
              <button className="inline-flex items-center gap-1 rounded-full border border-brand/30 px-3 py-0.5 text-[13px] font-bold text-brand mt-2 hover:bg-brand/5 transition-colors">
                <Globe className="size-3.5" />
                Everyone can reply
              </button>

              <div className="mt-3 border-t border-border-custom pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Category picker */}
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory((v ?? "") as PostCategory | "")
                    }
                  >
                    <SelectTrigger className="h-8 w-auto gap-1 text-xs border-0 px-2 text-brand hover:bg-brand/10 rounded-full">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POST_CATEGORY_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {/* Image upload */}
                  <button
                    className="inline-flex items-center justify-center size-9 rounded-full text-brand hover:bg-brand/10 transition-colors"
                    type="button"
                  >
                    <ImagePlus className="size-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <span
                      className={`text-[13px] ${
                        content.length > charLimit ? "text-[#F4212E]" : "text-muted-text"
                      }`}
                    >
                      {content.length}/{charLimit}
                    </span>
                  )}
                  <button
                    onClick={handlePost}
                    disabled={!content.trim() || content.length > charLimit || posting}
                    className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {posting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
