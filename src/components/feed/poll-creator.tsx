"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { PollData } from "@/types";

interface PollCreatorProps {
  onPollChange: (poll: PollData | null) => void;
  onCancel: () => void;
}

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "6 hours", value: 6 },
  { label: "1 day", value: 24 },
  { label: "3 days", value: 72 },
  { label: "7 days", value: 168 },
];

export function PollCreator({ onPollChange, onCancel }: PollCreatorProps) {
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationHours, setDurationHours] = useState(24);

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== index);
      setOptions(updated);
      emitPoll(updated, durationHours);
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    emitPoll(updated, durationHours);
  };

  const emitPoll = (opts: string[], hours: number) => {
    const validOptions = opts.filter((o) => o.trim().length > 0);
    if (validOptions.length >= 2) {
      const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      onPollChange({
        options: opts.map((text) => ({ text: text.trim(), vote_count: 0 })),
        total_votes: 0,
        ends_at: endsAt,
      });
    } else {
      onPollChange(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border-custom p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-bold text-text-primary">Create poll</span>
        <button
          onClick={onCancel}
          className="size-7 rounded-full hover:bg-[#F4212E]/10 flex items-center justify-center transition-colors"
        >
          <X className="size-4 text-muted-text" />
        </button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              maxLength={25}
              className="flex-1 h-10 rounded-md border border-border-custom bg-transparent px-3 text-[15px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(index)}
                className="size-8 rounded-full hover:bg-[#F4212E]/10 flex items-center justify-center transition-colors"
              >
                <X className="size-4 text-muted-text" />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 4 && (
        <button
          onClick={addOption}
          className="mt-2 inline-flex items-center gap-1 text-[14px] text-brand hover:text-brand-dark transition-colors"
        >
          <Plus className="size-4" />
          Add option
        </button>
      )}

      {/* Duration */}
      <div className="mt-3 pt-3 border-t border-border-custom">
        <label className="text-[13px] font-medium text-muted-text block mb-1">
          Poll duration
        </label>
        <select
          value={durationHours}
          onChange={(e) => {
            const hours = Number(e.target.value);
            setDurationHours(hours);
            emitPoll(options, hours);
          }}
          className="h-9 rounded-md border border-border-custom bg-transparent px-3 text-[14px] text-text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
