"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";
import type { CaseDiscussion } from "@/types";

export const dynamic = "force-dynamic";

export default function CaseCirclesPage() {
  const { profile, lawyerProfile } = useAuth();
  const [discussions, setDiscussions] = useState<CaseDiscussion[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = isPaidSubscriptionTier(lawyerProfile?.subscription_tier);

  useEffect(() => {
    if (!profile || profile.role !== "lawyer") return;

    const q = query(
      collection(db, "case_discussions"),
      where("status", "==", "open"),
      orderBy("last_message_at", "desc"),
      firestoreLimit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setDiscussions(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as CaseDiscussion)
          )
        );
      },
      () => {}
    );

    return () => unsubscribe();
  }, [profile]);

  async function handleCreate() {
    if (!isSubscribed || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/case-discussions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          practice_area: practiceArea,
          urgency: "normal",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not create Case Circle");
      }

      setTitle("");
      setSummary("");
      setPracticeArea("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create request");
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile || profile.role !== "lawyer") {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-[15px] text-muted-text">
          Case Circles are available for lawyer accounts only.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex h-[53px] items-center gap-4 border-b border-border-custom bg-white/85 px-4 backdrop-blur-md">
        <Link
          href="/dashboard"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.07]"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-text-primary">
            Case Circles
          </h1>
          <p className="text-[13px] text-muted-text">
            Lawyer-only requests for professional input
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-lg border border-border-custom bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
              {isSubscribed ? (
                <MessageSquarePlus className="size-5" />
              ) : (
                <Lock className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-black text-text-primary">
                Request help from other lawyers
              </h2>
              <p className="mt-1 text-[14px] text-muted-text">
                Share a matter summary and invite subscribed lawyers to join a focused discussion.
              </p>

              {!isSubscribed ? (
                <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light p-3">
                  <p className="text-[14px] font-bold text-text-primary">
                    Subscription required
                  </p>
                  <p className="mt-1 text-[13px] text-muted-text">
                    Free lawyers can onboard and browse, but Case Circles are reserved for paid lawyer plans.
                  </p>
                  <Link
                    href="/dashboard/subscription"
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-dark"
                  >
                    View plans
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Topic or case issue"
                    maxLength={140}
                    className="h-10 w-full rounded-lg border border-border-custom px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  <input
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value)}
                    placeholder="Practice area (optional)"
                    maxLength={80}
                    className="h-10 w-full rounded-lg border border-border-custom px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Briefly describe the issue and what input you need. Avoid sharing client-identifying details unless you have permission."
                    maxLength={1200}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border-custom px-3 py-2 text-[15px] leading-6 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  {error && (
                    <p className="text-[13px] font-semibold text-error">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleCreate}
                    disabled={!title.trim() || !summary.trim() || submitting}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Start Case Circle
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border-custom bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border-custom px-4 py-3">
            <h2 className="text-[15px] font-black text-text-primary">
              Open requests
            </h2>
            <Users className="size-5 text-muted-text" />
          </div>
          {discussions.length === 0 ? (
            <p className="px-4 py-8 text-center text-[15px] text-muted-text">
              No Case Circles yet.
            </p>
          ) : (
            discussions.map((discussion) => (
              <Link
                key={discussion.id}
                href={`/dashboard/case-circles/${discussion.id}`}
                className="flex items-center gap-3 border-b border-border-custom px-4 py-3 last:border-b-0 hover:bg-black/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[15px] font-bold text-text-primary">
                      {discussion.title}
                    </h3>
                    {discussion.practice_area && (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">
                        {discussion.practice_area}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-text">
                    {discussion.last_message_preview || discussion.summary}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-text">
                    {discussion.participant_count} participant
                    {discussion.participant_count === 1 ? "" : "s"} · Started by{" "}
                    {discussion.creator_name}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-text" />
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
