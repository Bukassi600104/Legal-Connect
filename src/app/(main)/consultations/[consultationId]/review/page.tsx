"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  ArrowLeft,
  Star,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { Consultation, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  const params = useParams();
  const consultationId = params.consultationId as string;
  const { user, loading: authLoading } = useAuth();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [lawyerUser, setLawyerUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function fetchData() {
      try {
        const consultDoc = await getDoc(doc(db, "consultations", consultationId));
        if (!consultDoc.exists()) {
          return;
        }

        const consultData = { id: consultDoc.id, ...consultDoc.data() } as Consultation;
        setConsultation(consultData);

        const lawyerDoc = await getDoc(doc(db, "users", consultData.lawyer_id));
        if (lawyerDoc.exists()) {
          setLawyerUser({ id: lawyerDoc.id, ...lawyerDoc.data() } as UserProfile);
        }

        const reviewQuery = query(
          collection(db, "reviews"),
          where("consultation_id", "==", consultationId),
          where("client_id", "==", user!.uid)
        );
        const reviewSnap = await getDocs(reviewQuery);
        if (!reviewSnap.empty) {
          setAlreadyReviewed(true);
        }
      } catch (error) {
        console.error("Error fetching consultation:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [user, consultationId, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !consultation || rating === 0 || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation_id: consultationId,
          rating,
          content: content.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Review submission failed");
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || (user && loading)) return <PageLoader />;

  if (!user) return null;

  if (success) {
    return (
      <div className="px-8 py-16 text-center">
        <CheckCircle2 className="size-12 text-[#00BA7C] mx-auto" />
        <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
          Review Submitted!
        </h2>
        <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
          Thank you for your feedback. It helps others make informed decisions.
        </p>
        <Link
          href="/consultations"
          className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          Back to Consultations
        </Link>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="px-8 py-16 text-center">
        <Star className="size-12 text-brand mx-auto" />
        <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
          Already Reviewed
        </h2>
        <p className="mt-2 text-[15px] text-muted-text">
          You have already submitted a review for this consultation.
        </p>
        <Link
          href="/consultations"
          className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          Back to Consultations
        </Link>
      </div>
    );
  }

  if (
    !consultation ||
    consultation.status !== "completed" ||
    consultation.client_id !== user?.uid
  ) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-[15px] text-muted-text">
          Reviews can only be submitted for completed consultations.
        </p>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href="/consultations"
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-extrabold text-text-primary">Leave a Review</h1>
      </div>

      {/* Lawyer info */}
      <div className="px-4 py-4 border-b border-border-custom flex items-center gap-3">
        <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[17px]">
          {lawyerUser?.full_name?.charAt(0)?.toUpperCase() || "L"}
        </div>
        <div>
          <p className="text-[15px] font-bold text-text-primary">
            {lawyerUser?.full_name || "Lawyer"}
          </p>
          <p className="text-[13px] text-muted-text">
            {consultation.topic || "General Consultation"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-border-custom">
        {/* Star rating */}
        <div className="px-4 py-6 text-center">
          <p className="text-[15px] font-bold text-text-primary mb-3">
            How was your experience?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-10 transition-colors",
                    i <= displayRating
                      ? "fill-brand text-brand"
                      : "text-[#EFF3F4]"
                  )}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="mt-2 text-[13px] text-muted-text">
              {displayRating === 1
                ? "Poor"
                : displayRating === 2
                ? "Fair"
                : displayRating === 3
                ? "Good"
                : displayRating === 4
                ? "Very Good"
                : "Excellent"}
            </p>
          )}
        </div>

        {/* Written review */}
        <div className="px-4 py-4">
          <label className="text-[13px] font-medium text-muted-text block mb-1.5">
            Your Review (Optional)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share details about your experience..."
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-border-custom bg-transparent p-3 text-[15px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
          <p className="mt-1 text-[12px] text-muted-text text-right">
            {content.length}/1000
          </p>
        </div>

        {/* Submit */}
        <div className="px-4 py-4">
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full h-[44px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
