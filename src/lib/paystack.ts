// Paystack configuration for LegalConnect NG
// Prices in kobo (1 NGN = 100 kobo)

export const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

export const SUBSCRIPTION_PLANS = {
  professional: {
    id: "professional",
    name: "Professional",
    price_monthly: 1500000, // ₦15,000
    price_yearly: 14400000, // ₦144,000 (₦12,000/mo)
    features: {
      verified_badge: true,
      priority_listing: true,
      unlimited_posts: true,
      consultation_booking: true,
      profile_analytics: true,
      featured_in_search: false,
      custom_profile_url: false,
      priority_support: false,
    },
    description: "Perfect for lawyers starting to build their online presence",
  },
  elite: {
    id: "elite",
    name: "Elite",
    price_monthly: 3500000, // ₦35,000
    price_yearly: 33600000, // ₦336,000 (₦28,000/mo)
    features: {
      verified_badge: true,
      priority_listing: true,
      unlimited_posts: true,
      consultation_booking: true,
      profile_analytics: true,
      featured_in_search: true,
      custom_profile_url: true,
      priority_support: true,
    },
    description: "For established lawyers who want maximum visibility",
  },
} as const;

export const FEATURE_LABELS: Record<string, string> = {
  verified_badge: "Verified Badge",
  priority_listing: "Priority in Search",
  unlimited_posts: "Unlimited Posts",
  consultation_booking: "Consultation Booking",
  profile_analytics: "Profile Analytics",
  featured_in_search: "Featured in Search Results",
  custom_profile_url: "Custom Profile URL",
  priority_support: "Priority Support",
};

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}
