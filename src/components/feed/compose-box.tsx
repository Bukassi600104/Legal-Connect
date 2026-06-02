"use client";

import { useState } from "react";
import { Globe, ImagePlus, Loader2 } from "lucide-react";
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
    <div className="m-4 rounded-lg border border-border-custom bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {profile.avatar_url ? (
          <OptimizedAvatar
            src={profile.avatar_url}
            alt={profile.full_name}
            className="size-10"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
            {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <textarea
            placeholder="Share a legal insight or update"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (!expanded && e.target.value) setExpanded(true);
            }}
            onFocus={() => setExpanded(true)}
            className="min-h-[84px] w-full resize-none rounded-lg border border-border-custom bg-[#F8FAFC] px-3 py-2 text-[16px] leading-6 text-text-primary placeholder:text-muted-text focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
            rows={expanded ? 3 : 1}
          />

          {expanded && (
            <>
              <button className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand/20 px-3 py-1 text-[13px] font-bold text-brand transition-colors hover:bg-brand-light">
                <Globe className="size-3.5" />
                Public briefing
              </button>

              <div className="mt-3 flex items-center justify-between border-t border-border-custom pt-3">
                <div className="flex items-center gap-1">
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory((v ?? "") as PostCategory | "")
                    }
                  >
                    <SelectTrigger className="h-9 w-auto gap-1 rounded-lg border-border-custom px-3 text-xs font-bold text-brand hover:bg-brand-light">
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

                  <button
                    className="inline-flex size-9 items-center justify-center rounded-lg text-brand transition-colors hover:bg-brand-light"
                    type="button"
                    aria-label="Add image"
                  >
                    <ImagePlus className="size-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <span
                      className={`text-[13px] ${
                        content.length > charLimit
                          ? "text-error"
                          : "text-muted-text"
                      }`}
                    >
                      {content.length}/{charLimit}
                    </span>
                  )}
                  <button
                    onClick={handlePost}
                    disabled={
                      !content.trim() || content.length > charLimit || posting
                    }
                    className="inline-flex h-9 items-center rounded-lg bg-brand px-5 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {posting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Publish"
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
