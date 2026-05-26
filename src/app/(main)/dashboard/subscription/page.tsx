"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Crown,
  Gem,
  Loader2,
} from "lucide-react";
import { TierBadge } from "@/components/shared/tier-badge";
import { useAuth } from "@/components/providers/auth-provider";
import {
  SUBSCRIPTION_PLANS,
  FEATURE_LABELS,
  formatNaira,
} from "@/lib/paystack";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BillingCycle = "monthly" | "yearly";

export default function SubscriptionPage() {
  const { user, profile, lawyerProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = lawyerProfile?.subscription_tier || "free";

  async function handleSubscribe(planId: string) {
    if (!user || !profile || loading) return;
    setLoading(planId);

    try {
      const plan =
        SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) return;

      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
        }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        console.error("Payment error:", data.error);
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
    } finally {
      setLoading(null);
    }
  }

  const allFeatureKeys = Object.keys(FEATURE_LABELS);

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href="/dashboard"
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-extrabold text-text-primary">Subscription</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Current plan */}
        <div className="text-center">
          <h2 className="text-[23px] font-extrabold text-text-primary">
            Upgrade Your Practice
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            Get more visibility and grow your legal practice.
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-[13px] text-muted-text">Current plan:</span>
            <TierBadge tier={currentTier} />
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-[#EFF3F4] p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-full px-5 py-2 text-[14px] font-bold transition-colors",
                billingCycle === "monthly"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-muted-text"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "rounded-full px-5 py-2 text-[14px] font-bold transition-colors",
                billingCycle === "yearly"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-muted-text"
              )}
            >
              Yearly
              <span className="ml-1 text-[11px] text-[#00BA7C] font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {/* Free plan */}
          <div className="rounded-2xl border border-border-custom p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[17px] font-bold text-text-primary">Free</h3>
                <p className="text-[13px] text-muted-text">Basic presence</p>
              </div>
              <span className="text-[23px] font-extrabold text-text-primary">₦0</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[13px] text-muted-text">
                <Check className="size-4 text-[#00BA7C]" />
                Basic profile listing
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-text">
                <Check className="size-4 text-[#00BA7C]" />
                Up to 5 posts per month
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-text">
                <Check className="size-4 text-[#00BA7C]" />
                Receive messages
              </div>
            </div>
            {currentTier === "free" ? (
              <button disabled className="w-full h-9 rounded-full border border-border-custom text-[14px] font-bold text-muted-text">
                Current Plan
              </button>
            ) : (
              <button disabled className="w-full h-9 rounded-full border border-border-custom text-[14px] font-bold text-text-primary hover:bg-[#EFF3F4] transition-colors">
                Downgrade
              </button>
            )}
          </div>

          {/* Professional */}
          <div className="rounded-2xl border-2 border-brand p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-brand" />
                <div>
                  <h3 className="text-[17px] font-bold text-text-primary">Professional</h3>
                  <p className="text-[13px] text-muted-text">
                    {SUBSCRIPTION_PLANS.professional.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[23px] font-extrabold text-text-primary">
                  {formatNaira(
                    billingCycle === "yearly"
                      ? SUBSCRIPTION_PLANS.professional.price_yearly / 12
                      : SUBSCRIPTION_PLANS.professional.price_monthly
                  )}
                </span>
                <p className="text-[11px] text-muted-text">/month</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {allFeatureKeys.map((key) => {
                const hasFeature =
                  SUBSCRIPTION_PLANS.professional.features[
                    key as keyof typeof SUBSCRIPTION_PLANS.professional.features
                  ];
                return (
                  <div key={key} className="flex items-center gap-2 text-[13px] text-muted-text">
                    {hasFeature ? (
                      <Check className="size-4 text-[#00BA7C]" />
                    ) : (
                      <X className="size-4 text-[#EFF3F4]" />
                    )}
                    {FEATURE_LABELS[key]}
                  </div>
                );
              })}
            </div>

            {currentTier === "professional" ? (
              <button disabled className="w-full h-9 rounded-full bg-brand/20 text-[14px] font-bold text-brand">
                Current Plan
              </button>
            ) : (
              <button
                className="w-full h-9 rounded-full bg-brand text-[14px] font-bold text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
                disabled={!!loading}
                onClick={() => handleSubscribe("professional")}
              >
                {loading === "professional" && (
                  <Loader2 className="size-4 animate-spin inline mr-2" />
                )}
                {currentTier === "elite" ? "Switch Plan" : "Upgrade"}
              </button>
            )}
          </div>

          {/* Elite */}
          <div className="rounded-2xl border border-border-custom p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                Popular
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gem className="size-5 text-brand" />
                <div>
                  <h3 className="text-[17px] font-bold text-text-primary">Elite</h3>
                  <p className="text-[13px] text-muted-text">
                    {SUBSCRIPTION_PLANS.elite.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[23px] font-extrabold text-text-primary">
                  {formatNaira(
                    billingCycle === "yearly"
                      ? SUBSCRIPTION_PLANS.elite.price_yearly / 12
                      : SUBSCRIPTION_PLANS.elite.price_monthly
                  )}
                </span>
                <p className="text-[11px] text-muted-text">/month</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {allFeatureKeys.map((key) => {
                const hasFeature =
                  SUBSCRIPTION_PLANS.elite.features[
                    key as keyof typeof SUBSCRIPTION_PLANS.elite.features
                  ];
                return (
                  <div key={key} className="flex items-center gap-2 text-[13px] text-muted-text">
                    {hasFeature ? (
                      <Check className="size-4 text-[#00BA7C]" />
                    ) : (
                      <X className="size-4 text-[#EFF3F4]" />
                    )}
                    {FEATURE_LABELS[key]}
                  </div>
                );
              })}
            </div>

            {currentTier === "elite" ? (
              <button disabled className="w-full h-9 rounded-full bg-brand/20 text-[14px] font-bold text-brand">
                Current Plan
              </button>
            ) : (
              <button
                className="w-full h-9 rounded-full bg-text-primary text-[14px] font-bold text-white hover:bg-text-primary/90 transition-colors disabled:opacity-50"
                disabled={!!loading}
                onClick={() => handleSubscribe("elite")}
              >
                {loading === "elite" && (
                  <Loader2 className="size-4 animate-spin inline mr-2" />
                )}
                Upgrade to Elite
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
