"use client";

import { useState } from "react";
import { Star, Check, Zap, MessageCircle, BarChart3, Shield } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { PremiumBadge } from "@/components/shared/premium-badge";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Zap,
    title: "Longer posts",
    description: "Write up to 5,000 characters per post instead of 200.",
  },
  {
    icon: BarChart3,
    title: "Create polls",
    description: "Engage your audience with interactive polls on your posts.",
  },
  {
    icon: MessageCircle,
    title: "Extended chat",
    description: "Longer messaging sessions with lawyers and other users.",
  },
  {
    icon: Star,
    title: "Premium badge",
    description: "Stand out with a gold star badge next to your name.",
  },
  {
    icon: Shield,
    title: "Thread creation",
    description: "Create multi-post threads for detailed discussions.",
  },
];

const PRICING = {
  client: {
    monthly: 2500,
    yearly: 25000,
    label: "Users",
  },
  lawyer: {
    monthly: 7500,
    yearly: 75000,
    label: "Lawyers",
  },
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PremiumPage() {
  const { profile } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const isLawyer = profile?.role === "lawyer";
  const isPremium = profile?.is_premium;
  const pricing = isLawyer ? PRICING.lawyer : PRICING.client;
  const savedPercent = Math.round(
    ((pricing.monthly * 12 - pricing.yearly) / (pricing.monthly * 12)) * 100
  );

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center">
        <h1 className="text-xl font-extrabold text-text-primary">Premium</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#FFD700]/10 mb-4">
            <Star className="size-8 text-[#FFD700] fill-[#FFD700]" />
          </div>
          <h2 className="text-[28px] font-extrabold text-text-primary">
            {isPremium ? "You have Premium" : "Upgrade to Premium"}
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-md mx-auto">
            {isPremium
              ? "You're enjoying all premium features on LegalConnect."
              : "Unlock powerful features to get more out of LegalConnect."}
          </p>
        </div>

        {/* Already premium */}
        {isPremium && (
          <div className="rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-6 text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PremiumBadge size="default" />
              <span className="text-[17px] font-bold text-text-primary">Active Premium</span>
            </div>
            <p className="text-[15px] text-muted-text">
              Your premium subscription is active. You have access to all premium features.
            </p>
          </div>
        )}

        {/* Billing toggle */}
        {!isPremium && (
          <>
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-4 py-2 rounded-full text-[15px] font-bold transition-colors ${
                  billing === "monthly"
                    ? "bg-text-primary text-white"
                    : "bg-[#EFF3F4] text-text-primary hover:bg-[#E7E9EA]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-4 py-2 rounded-full text-[15px] font-bold transition-colors ${
                  billing === "yearly"
                    ? "bg-text-primary text-white"
                    : "bg-[#EFF3F4] text-text-primary hover:bg-[#E7E9EA]"
                }`}
              >
                Yearly
                <span className="ml-1 text-[13px] text-[#00BA7C]">Save {savedPercent}%</span>
              </button>
            </div>

            {/* Pricing cards */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {/* User pricing */}
              <div className={`rounded-2xl border p-6 ${
                !isLawyer ? "border-brand bg-brand/5" : "border-border-custom"
              }`}>
                <p className="text-[13px] font-bold text-muted-text uppercase tracking-wide mb-1">
                  {PRICING.client.label}
                </p>
                <p className="text-[28px] font-extrabold text-text-primary">
                  {formatNaira(billing === "monthly" ? PRICING.client.monthly : PRICING.client.yearly)}
                </p>
                <p className="text-[13px] text-muted-text">
                  per {billing === "monthly" ? "month" : "year"}
                </p>
                {!isLawyer && !isPremium && (
                  <button className="mt-4 w-full h-10 rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark transition-colors">
                    Subscribe
                  </button>
                )}
              </div>

              {/* Lawyer pricing */}
              <div className={`rounded-2xl border p-6 ${
                isLawyer ? "border-brand bg-brand/5" : "border-border-custom"
              }`}>
                <p className="text-[13px] font-bold text-muted-text uppercase tracking-wide mb-1">
                  {PRICING.lawyer.label}
                </p>
                <p className="text-[28px] font-extrabold text-text-primary">
                  {formatNaira(billing === "monthly" ? PRICING.lawyer.monthly : PRICING.lawyer.yearly)}
                </p>
                <p className="text-[13px] text-muted-text">
                  per {billing === "monthly" ? "month" : "year"}
                </p>
                {isLawyer && !isPremium && (
                  <button className="mt-4 w-full h-10 rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark transition-colors">
                    Subscribe
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Features list */}
        <div className="rounded-2xl bg-[#F7F9F9] overflow-hidden">
          <h3 className="px-4 pt-4 pb-2 text-[17px] font-extrabold text-text-primary">
            What you get with Premium
          </h3>
          <div className="divide-y divide-border-custom">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 size-8 shrink-0 rounded-full bg-brand/10 flex items-center justify-center">
                  <feature.icon className="size-4 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-text-primary">{feature.title}</p>
                    {isPremium && <Check className="size-4 text-[#00BA7C]" />}
                  </div>
                  <p className="text-[13px] text-muted-text">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
