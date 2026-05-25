import { Crown, Gem, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

interface TierBadgeProps {
  tier: SubscriptionTier | string;
  size?: "sm" | "default";
  className?: string;
}

const tierIcons: Record<string, typeof Crown> = {
  free: User,
  professional: Gem,
  elite: Crown,
  premium: Crown, // alias for backwards compat
};

export function TierBadge({ tier, size = "default", className }: TierBadgeProps) {
  if (tier === "free" || !tier) return null;

  const Icon = tierIcons[tier] || Crown;
  const label = TIER_LABELS[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
  const colorClass = TIER_COLORS[tier] || "bg-brand/10 text-brand border-brand/30";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colorClass,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Icon className={size === "sm" ? "size-2.5" : "size-3"} />
      {label}
    </span>
  );
}
