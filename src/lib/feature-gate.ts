import type { SubscriptionTier } from "@/types";

// Feature gating configuration
// Determines which features are available for each subscription tier

interface TierLimits {
  maxPostsPerMonth: number;
  canBookConsultations: boolean;
  canViewAnalytics: boolean;
  priorityInSearch: boolean;
  featuredInSearch: boolean;
  customProfileUrl: boolean;
  prioritySupport: boolean;
  maxMediaPerPost: number;
  canPinPosts: boolean;
  canBoostPosts: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxPostsPerMonth: 5,
    canBookConsultations: true,
    canViewAnalytics: false,
    priorityInSearch: false,
    featuredInSearch: false,
    customProfileUrl: false,
    prioritySupport: false,
    maxMediaPerPost: 1,
    canPinPosts: false,
    canBoostPosts: false,
  },
  professional: {
    maxPostsPerMonth: Infinity,
    canBookConsultations: true,
    canViewAnalytics: true,
    priorityInSearch: true,
    featuredInSearch: false,
    customProfileUrl: false,
    prioritySupport: false,
    maxMediaPerPost: 4,
    canPinPosts: true,
    canBoostPosts: false,
  },
  elite: {
    maxPostsPerMonth: Infinity,
    canBookConsultations: true,
    canViewAnalytics: true,
    priorityInSearch: true,
    featuredInSearch: true,
    customProfileUrl: true,
    prioritySupport: true,
    maxMediaPerPost: 10,
    canPinPosts: true,
    canBoostPosts: true,
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    canViewAnalytics:
      "Upgrade to Professional to access profile analytics.",
    priorityInSearch:
      "Upgrade to Professional for priority placement in search results.",
    featuredInSearch:
      "Upgrade to Elite to get featured in search results.",
    customProfileUrl:
      "Upgrade to Elite for a custom profile URL.",
    prioritySupport:
      "Upgrade to Elite for priority customer support.",
    canPinPosts: "Upgrade to Professional to pin your best posts.",
    canBoostPosts:
      "Upgrade to Elite to boost your posts for more visibility.",
    canCreatePolls: "Upgrade to Premium to create polls in your posts.",
    canCreateThreads: "Upgrade to Premium to create multi-post threads.",
  };
  return (
    messages[feature] || "Upgrade your plan to unlock this feature."
  );
}

// ============ PREMIUM FEATURES (User-level, not lawyer-tier) ============

export interface PremiumLimits {
  charLimit: number;
  canCreatePolls: boolean;
  canCreateThreads: boolean;
  premiumBadge: boolean;
  canSendLongMessages: boolean;
  maxMediaPerPost: number;
}

const FREE_LIMITS: PremiumLimits = {
  charLimit: 200,
  canCreatePolls: false,
  canCreateThreads: false,
  premiumBadge: false,
  canSendLongMessages: false,
  maxMediaPerPost: 1,
};

const PREMIUM_LIMITS: PremiumLimits = {
  charLimit: 5000,
  canCreatePolls: true,
  canCreateThreads: true,
  premiumBadge: true,
  canSendLongMessages: true,
  maxMediaPerPost: 10,
};

export function getPremiumLimits(isPremium: boolean): PremiumLimits {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}

export function canUsePremiumFeature(
  isPremium: boolean,
  feature: keyof PremiumLimits
): boolean {
  const limits = getPremiumLimits(isPremium);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}
