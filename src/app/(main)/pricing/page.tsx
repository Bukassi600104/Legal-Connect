"use client";

import Link from "next/link";
import {
  Check,
  BadgeCheck,
  MessageCircle,
  BarChart3,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    name: "Free",
    price: "NGN 0",
    period: "forever",
    description: "Get started and build your presence",
    features: [
      "Basic profile listing",
      "Up to 3 posts per month",
      "Receive messages from clients",
      "Appear in search results",
      "Basic analytics",
    ],
  },
  {
    name: "Professional",
    price: "NGN 15,000",
    period: "per month",
    description: "For growing practices",
    popular: true,
    features: [
      "Verified badge on profile",
      "Unlimited posts",
      "Priority in search results",
      "Detailed analytics dashboard",
      "Client consultation booking",
      "Direct messaging with clients",
      "Profile performance insights",
      "Featured in category pages",
    ],
  },
  {
    name: "Elite",
    price: "NGN 35,000",
    period: "per month",
    description: "For established firms and top lawyers",
    features: [
      "Everything in Professional",
      "Top placement in search results",
      "Premium verification badge",
      "Featured on homepage",
      "Priority client matching",
      "Advanced analytics and reports",
      "Dedicated support",
      "Multi-lawyer firm profiles",
    ],
  },
];

const CONSULTATION_RATES = [
  { specialization: "Corporate and Commercial Law", range: "NGN 75,000 - NGN 350,000" },
  { specialization: "Family Law", range: "NGN 50,000 - NGN 200,000" },
  { specialization: "Criminal Defense", range: "NGN 60,000 - NGN 250,000" },
  { specialization: "Property and Real Estate", range: "NGN 40,000 - NGN 180,000" },
  { specialization: "Tax Law", range: "NGN 150,000 - NGN 750,000" },
  { specialization: "Oil and Gas / Energy", range: "NGN 200,000 - NGN 1,000,000" },
  { specialization: "Employment and Labour", range: "NGN 35,000 - NGN 150,000" },
  { specialization: "Human Rights and Constitutional", range: "NGN 100,000 - NGN 500,000" },
];

export default function PricingPage() {
  const { profile, loading } = useAuth();
  const isLawyer = profile?.role === "lawyer";
  const planHref = isLawyer ? "/dashboard/subscription" : "/signup/lawyer";

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href="/feed"
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-extrabold text-text-primary">Pricing</h1>
      </div>

      <div className="px-4 py-6 border-b border-border-custom text-center">
        <h2 className="text-[23px] font-extrabold text-text-primary">
          {isLawyer ? "Grow Your Practice" : "Transparent Pricing"}
        </h2>
        <p className="mt-1 text-[15px] text-muted-text max-w-sm mx-auto">
          {isLawyer
            ? "Choose the plan that fits your practice."
            : "Browse lawyer plans and typical consultation ranges before you create an account."}
        </p>
      </div>

      <div className="border-b border-border-custom">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`px-4 py-5 border-b border-border-custom last:border-b-0 ${
              plan.popular ? "bg-brand/[0.02]" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2 gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold text-text-primary">
                  {plan.name}
                </h3>
                {plan.popular && (
                  <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[20px] font-extrabold text-text-primary">
                  {plan.price}
                </span>
                <span className="text-[13px] text-muted-text ml-1">
                  /{plan.period}
                </span>
              </div>
            </div>
            <p className="text-[13px] text-muted-text mb-3">
              {plan.description}
            </p>
            <ul className="space-y-1.5 mb-4">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-[13px] text-text-primary"
                >
                  <Check className="size-4 shrink-0 text-[#00BA7C] mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.name === "Free" ? "/signup/lawyer" : planHref}
              className={`block text-center h-9 rounded-full text-[14px] font-bold transition-colors leading-9 ${
                plan.name === "Free"
                  ? "border border-border-custom text-text-primary hover:bg-[#EFF3F4]"
                  : plan.popular
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "bg-text-primary text-white hover:bg-text-primary/90"
              }`}
            >
              {plan.name === "Free"
                ? isLawyer
                  ? "Current Plan"
                  : "Start Free"
                : loading
                  ? "View Plan"
                  : isLawyer
                    ? "Upgrade Now"
                    : "Join as a Lawyer"}
            </Link>
          </div>
        ))}
      </div>

      <div className="px-4 py-6 border-b border-border-custom">
        <h3 className="text-[17px] font-bold text-text-primary mb-1">
          Typical Consultation Rates
        </h3>
        <p className="text-[13px] text-muted-text mb-4">
          Rates vary by experience, complexity, location, and lawyer-client
          agreement. Client consultation payments are not collected inside
          LegalConnect NG in V1.
        </p>

        <div className="space-y-0">
          {CONSULTATION_RATES.map((rate) => (
            <div
              key={rate.specialization}
              className="flex items-center justify-between gap-4 py-3 border-b border-border-custom last:border-b-0"
            >
              <span className="text-[15px] text-text-primary">
                {rate.specialization}
              </span>
              <span className="text-[14px] font-bold text-brand text-right">
                {rate.range}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        <h3 className="text-[17px] font-bold text-text-primary mb-4">
          Why LegalConnect?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: BadgeCheck, label: "Verified Lawyers", desc: "Credential-checked" },
            { icon: MessageCircle, label: "Direct Chat", desc: "Message before booking" },
            { icon: Search, label: "Smart Search", desc: "By specialty and location" },
            { icon: BarChart3, label: "Growth Tools", desc: "Plans for lawyer visibility" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center">
                <item.icon className="size-5 text-brand" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-text-primary">
                  {item.label}
                </p>
                <p className="text-[12px] text-muted-text">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
