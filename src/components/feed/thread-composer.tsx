"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { getPremiumLimits } from "@/lib/feature-gate";

interface ThreadComposerProps {
  onThreadCreated?: () => void;
  onCancel?: () => void;
}

export function ThreadComposer({ onThreadCreated, onCancel }: ThreadComposerProps) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<string[]>(["", ""]);
  const [posting, setPosting] = useState(false);

  if (!profile) return null;

  const limits = getPremiumLimits(profile.is_premium ?? false);
  const charLimit = limits.charLimit;

  const addEntry = () => {
    if (entries.length < 10) {
      setEntries([...entries, ""]);
    }
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, value: string) => {
    const updated = [...entries];
    updated[index] = value;
    setEntries(updated);
  };

  const canPost = entries.every((e) => e.trim().length > 0 && e.length <= charLimit);

  const handlePost = async () => {
    if (!canPost || posting) return;
    setPosting(true);

    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: entries.map((entry) => ({
            content: entry.trim(),
            category: "general",
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Thread creation failed");
      }

      setEntries(["", ""]);
      onThreadCreated?.();
    } catch (error) {
      console.error("Error creating thread:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="border-b border-border-custom">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom">
        <button
          onClick={onCancel}
          className="text-[15px] text-muted-text hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <span className="text-[15px] font-bold text-text-primary">New thread</span>
        <button
          onClick={handlePost}
          disabled={!canPost || posting}
          className="inline-flex h-8 items-center rounded-full bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {posting ? <Loader2 className="size-4 animate-spin" /> : "Post all"}
        </button>
      </div>

      {/* Thread entries */}
      <div className="divide-y divide-border-custom">
        {entries.map((entry, index) => (
          <div key={index} className="px-4 py-3">
            <div className="flex gap-3">
              {/* Connector line */}
              <div className="flex flex-col items-center">
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
                {index < entries.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border-custom mt-1" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-bold text-text-primary">
                    {profile.full_name}
                  </span>
                  {entries.length > 2 && (
                    <button
                      onClick={() => removeEntry(index)}
                      className="size-6 rounded-full hover:bg-[#F4212E]/10 flex items-center justify-center transition-colors"
                    >
                      <X className="size-3.5 text-muted-text hover:text-[#F4212E]" />
                    </button>
                  )}
                </div>
                <textarea
                  placeholder={index === 0 ? "Start a thread..." : "Add to thread..."}
                  value={entry}
                  onChange={(e) => updateEntry(index, e.target.value)}
                  className="w-full min-h-[60px] resize-none border-0 bg-transparent p-0 text-[15px] text-text-primary placeholder:text-muted-text focus:outline-none focus:ring-0"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] ${
                      entry.length > charLimit ? "text-[#F4212E]" : "text-muted-text"
                    }`}
                  >
                    {entry.length}/{charLimit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add entry button */}
      {entries.length < 10 && (
        <div className="px-4 py-2 border-t border-border-custom">
          <button
            onClick={addEntry}
            className="inline-flex items-center gap-2 text-[15px] text-brand hover:text-brand-dark transition-colors"
          >
            <Plus className="size-4" />
            Add to thread
          </button>
        </div>
      )}
    </div>
  );
}
