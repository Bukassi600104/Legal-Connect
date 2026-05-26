"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CreditCard, Crown, Gem, Users } from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import type { Subscription, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

interface SubWithUser extends Subscription {
  lawyer?: UserProfile;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierCounts, setTierCounts] = useState({
    free: 0,
    professional: 0,
    elite: 0,
  });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "subscriptions"),
        where("status", "==", "active"),
        orderBy("created_at", "desc")
      );

      const snap = await getDocs(q);
      const subs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Subscription)
      );

      const hydrated: SubWithUser[] = await Promise.all(
        subs.map(async (sub) => {
          let lawyer: UserProfile | undefined;
          try {
            const userDoc = await getDoc(doc(db, "users", sub.lawyer_id));
            if (userDoc.exists()) {
              lawyer = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            }
          } catch {}
          return { ...sub, lawyer };
        })
      );

      setSubscriptions(hydrated);

      try {
        const lawyersSnap = await getDocs(collection(db, "lawyer_profiles"));
        const counts = { free: 0, professional: 0, elite: 0 };
        lawyersSnap.docs.forEach((d) => {
          const tier = d.data().subscription_tier as string;
          if (tier in counts) {
            counts[tier as keyof typeof counts]++;
          }
        });
        setTierCounts(counts);
      } catch {}
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSubscriptions();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchSubscriptions]);

  if (loading) return <PageLoader />;

  const tierItems = [
    {
      label: "Free Tier",
      value: tierCounts.free,
      icon: Users,
      color: "text-muted-text",
      bg: "bg-[#EFF3F4]",
    },
    {
      label: "Professional",
      value: tierCounts.professional,
      icon: Crown,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      label: "Elite",
      value: tierCounts.elite,
      icon: Gem,
      color: "text-[#FFD700]",
      bg: "bg-[#FFD700]/10",
    },
  ];

  return (
    <div>
      {/* Tier distribution */}
      <div className="grid grid-cols-3 border-b border-border-custom">
        {tierItems.map((tier, i) => (
          <div
            key={tier.label}
            className={cn(
              "px-4 py-4",
              i < 2 && "border-r border-border-custom"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center",
                  tier.bg
                )}
              >
                <tier.icon className={cn("size-5", tier.color)} />
              </div>
              <div>
                <p className="text-[20px] font-extrabold text-text-primary">
                  {tier.value}
                </p>
                <p className="text-[12px] text-muted-text">{tier.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active subscriptions header */}
      <div className="px-4 py-3 border-b border-border-custom">
        <p className="text-[13px] text-muted-text">
          {subscriptions.length} active subscription
          {subscriptions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <CreditCard className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            No Active Subscriptions
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            No paid subscriptions have been created yet.
          </p>
        </div>
      ) : (
        <div>
          {subscriptions.map((sub) => {
            const periodEnd = sub.current_period_end
              ? typeof sub.current_period_end === "string"
                ? new Date(sub.current_period_end)
                : sub.current_period_end?.toDate?.() ?? new Date()
              : null;

            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[15px]">
                  {sub.lawyer?.full_name?.charAt(0)?.toUpperCase() || "L"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-text-primary truncate">
                      {sub.lawyer?.full_name || "Unknown"}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-bold rounded-full px-2 py-0.5",
                        sub.plan_id === "elite" &&
                          "bg-[#FFD700]/10 text-[#FFD700]",
                        sub.plan_id === "professional" &&
                          "bg-brand/10 text-brand",
                        sub.plan_id !== "elite" &&
                          sub.plan_id !== "professional" &&
                          "bg-[#EFF3F4] text-muted-text"
                      )}
                    >
                      {sub.plan_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-text">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        sub.status === "active"
                          ? "text-[#00BA7C]"
                          : "text-[#F4212E]"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          sub.status === "active"
                            ? "bg-[#00BA7C]"
                            : "bg-[#F4212E]"
                        )}
                      />
                      {sub.status}
                    </span>
                    {sub.billing_cycle && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{sub.billing_cycle}</span>
                      </>
                    )}
                    {periodEnd && (
                      <>
                        <span>·</span>
                        <span>
                          Ends{" "}
                          {periodEnd.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
