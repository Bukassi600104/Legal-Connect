"use client";

import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  size?: "sm" | "default";
  className?: string;
}

export function PremiumBadge({ size = "default", className }: PremiumBadgeProps) {
  return (
    <svg
      viewBox="0 0 22 22"
      className={cn(
        "shrink-0",
        size === "sm" ? "size-4" : "size-5",
        className
      )}
      aria-label="Premium"
    >
      <path
        d="M11 0L13.09 4.26L17.93 4.97L14.47 8.32L15.18 13.14L11 10.95L6.82 13.14L7.53 8.32L4.07 4.97L8.91 4.26L11 0Z"
        fill="#FFD700"
        stroke="#E6BE00"
        strokeWidth="0.5"
      />
    </svg>
  );
}
