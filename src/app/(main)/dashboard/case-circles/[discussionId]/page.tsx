"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { ArrowLeft, Loader2, Lock, Send, Users } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";
import type { CaseDiscussion, CaseDiscussionMessage } from "@/types";

export const dynamic = "force-dynamic";

function toDisplayDate(value: CaseDiscussionMessage["created_at"]) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value.toDate?.();
  return date
    ? date.toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

export default function CaseCircleDetailPage() {
  const params = useParams();
  const discussionId = params.discussionId as string;
  const { user, profile, lawyerProfile } = useAuth();
  const [discussion, setDiscussion] = useState<CaseDiscussion | null>(null);
  const [messages, setMessages] = useState<CaseDiscussionMessage[]>([]);
  const [content, setContent] = useState("");
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = isPaidSubscriptionTier(lawyerProfile?.subscription_tier);
  const isMember = Boolean(
    user?.uid && discussion?.member_ids?.includes(user.uid)
  );

  useEffect(() => {
    if (!discussionId) return;

    const unsubscribe = onSnapshot(
      doc(db, "case_discussions", discussionId),
      (snapshot) => {
        if (snapshot.exists()) {
          setDiscussion({
            id: snapshot.id,
            ...snapshot.data(),
          } as CaseDiscussion);
        }
      },
      () => {}
    );

    return () => unsubscribe();
  }, [discussionId]);

  useEffect(() => {
    if (!discussionId || !isMember) return;

    const q = query(
      collection(db, "case_discussions", discussionId, "messages"),
      orderBy("created_at", "asc"),
      firestoreLimit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as CaseDiscussionMessage)
          )
        );
      },
      () => {}
    );

    return () => unsubscribe();
  }, [discussionId, isMember]);

  async function handleJoin() {
    if (!isSubscribed || joining) return;
    setError(null);
    setJoining(true);

    try {
      const response = await fetch("/api/case-discussions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussion_id: discussionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not join Case Circle");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join discussion");
    } finally {
      setJoining(false);
    }
  }

  async function handleSend() {
    if (!content.trim() || !isMember || sending) return;
    setError(null);
    setSending(true);

    try {
      const response = await fetch("/api/case-discussions/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussion_id: discussionId,
          content,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not send message");
      }
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
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

  if (!discussion) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex h-[53px] items-center gap-4 border-b border-border-custom bg-white/85 px-4 backdrop-blur-md">
        <Link
          href="/dashboard/case-circles"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.07]"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-text-primary">
            {discussion.title}
          </h1>
          <p className="text-[13px] text-muted-text">
            {discussion.participant_count} participating lawyer
            {discussion.participant_count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="border-b border-border-custom p-4">
        <div className="rounded-lg border border-border-custom bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
              <Users className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[17px] font-black text-text-primary">
                  {discussion.title}
                </h2>
                {discussion.practice_area && (
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">
                    {discussion.practice_area}
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-text-primary">
                {discussion.summary}
              </p>
              <p className="mt-3 text-[13px] text-muted-text">
                Started by {discussion.creator_name}
              </p>

              {!isSubscribed && (
                <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light p-3">
                  <p className="flex items-center gap-2 text-[14px] font-bold text-text-primary">
                    <Lock className="size-4" />
                    Subscription required
                  </p>
                  <p className="mt-1 text-[13px] text-muted-text">
                    Only subscribed lawyers can accept requests and join Case Circle conversations.
                  </p>
                  <Link
                    href="/dashboard/subscription"
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-dark"
                  >
                    View plans
                  </Link>
                </div>
              )}

              {isSubscribed && !isMember && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {joining && <Loader2 className="size-4 animate-spin" />}
                  Accept request and join
                </button>
              )}
              {error && (
                <p className="mt-3 text-[13px] font-semibold text-error">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {isMember ? (
        <>
          <div className="space-y-3 p-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-lg border border-border-custom bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-bold text-text-primary">
                    {message.sender_name}
                  </p>
                  <p className="text-[12px] text-muted-text">
                    {toDisplayDate(message.created_at)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-text-primary">
                  {message.content}
                </p>
              </article>
            ))}
          </div>

          <div className="sticky bottom-0 border-t border-border-custom bg-white p-3">
            <div className="flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add your legal input"
                maxLength={4000}
                rows={2}
                className="min-h-11 flex-1 resize-none rounded-lg border border-border-custom px-3 py-2 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="px-8 py-12 text-center">
          <p className="text-[15px] text-muted-text">
            Accept the request to view and join the conversation.
          </p>
        </div>
      )}
    </div>
  );
}
