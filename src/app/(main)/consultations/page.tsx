"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Consultation, UserProfile, ConsultationStatus } from "@/types";

export const dynamic = "force-dynamic";

interface ConsultationWithUsers extends Consultation {
  lawyer_user?: UserProfile;
  client_user?: UserProfile;
}

const STATUS_STYLES: Record<
  ConsultationStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-brand", bg: "bg-brand/10" },
  confirmed: { label: "Confirmed", color: "text-[#00BA7C]", bg: "bg-[#00BA7C]/10" },
  completed: {
    label: "Completed",
    color: "text-text-primary",
    bg: "bg-[#EFF3F4]",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-[#F4212E]",
    bg: "bg-[#F4212E]/10",
  },
  no_show: {
    label: "No Show",
    color: "text-muted-text",
    bg: "bg-[#EFF3F4]",
  },
};

const TYPE_ICONS = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

export default function ConsultationsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const isLawyer = profile?.role === "lawyer";
  const [consultations, setConsultations] = useState<ConsultationWithUsers[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">(
    "upcoming"
  );
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchConsultations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const field = isLawyer ? "lawyer_id" : "client_id";
      let q;

      if (filter === "upcoming") {
        q = query(
          collection(db, "consultations"),
          where(field, "==", user.uid),
          where("status", "in", ["pending", "confirmed"]),
          orderBy("scheduled_at", "asc")
        );
      } else if (filter === "past") {
        q = query(
          collection(db, "consultations"),
          where(field, "==", user.uid),
          where("status", "in", ["completed", "cancelled", "no_show"]),
          orderBy("scheduled_at", "desc")
        );
      } else {
        q = query(
          collection(db, "consultations"),
          where(field, "==", user.uid),
          orderBy("scheduled_at", "desc")
        );
      }

      let snap;
      try {
        snap = await getDocs(q);
      } catch {
        q = query(
          collection(db, "consultations"),
          where(field, "==", user.uid)
        );
        snap = await getDocs(q);
      }

      const consults = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Consultation)
      );

      const hydrated: ConsultationWithUsers[] = await Promise.all(
        consults.map(async (c) => {
          let lawyer_user: UserProfile | undefined;
          let client_user: UserProfile | undefined;

          try {
            const otherField = isLawyer ? c.client_id : c.lawyer_id;
            const otherDoc = await getDoc(doc(db, "users", otherField));
            if (otherDoc.exists()) {
              const u = {
                id: otherDoc.id,
                ...otherDoc.data(),
              } as UserProfile;
              if (isLawyer) client_user = u;
              else lawyer_user = u;
            }
          } catch {}

          return { ...c, lawyer_user, client_user };
        })
      );

      setConsultations(hydrated);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, isLawyer, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      void fetchConsultations();
    }, 0);

    return () => clearTimeout(timer);
  }, [authLoading, fetchConsultations, user]);

  async function updateStatus(
    consultId: string,
    newStatus: ConsultationStatus
  ) {
    setProcessing(consultId);
    try {
      const response = await fetch("/api/consultations/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation_id: consultId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Consultation status update failed");
      }

      setConsultations((prev) =>
        prev.map((c) =>
          c.id === consultId ? { ...c, status: newStatus } : c
        )
      );
    } catch (error) {
      console.error("Error updating consultation:", error);
    } finally {
      setProcessing(null);
    }
  }

  const filterButtons = [
    { label: "Upcoming", value: "upcoming" as const },
    { label: "Past", value: "past" as const },
    { label: "All", value: "all" as const },
  ];

  if (authLoading || (user && loading)) return <PageLoader />;

  if (!user) return null;

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <h1 className="text-xl font-extrabold text-text-primary">Consultations</h1>
          {!isLawyer && (
            <Link
              href="/explore"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-dark transition-colors"
            >
              Book New
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
        {/* X-style tab filters */}
        <div className="flex">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={cn(
                "flex-1 flex items-center justify-center py-3 text-[15px] font-medium transition-colors hover:bg-black/[0.03] relative",
                filter === btn.value
                  ? "font-bold text-text-primary"
                  : "text-muted-text"
              )}
            >
              {btn.label}
              {filter === btn.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations list */}
      {consultations.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <Calendar className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            No consultations yet
          </h2>
          <p className="mt-1 text-[15px] text-muted-text max-w-sm mx-auto">
            {filter === "upcoming"
              ? "You don't have any upcoming consultations."
              : "No consultations found for this filter."}
          </p>
          {!isLawyer && (
            <Link
              href="/explore"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
            >
              Find a Lawyer
            </Link>
          )}
        </div>
      ) : (
        <div>
          {consultations.map((c) => {
            const scheduledAt = c.scheduled_at
              ? typeof c.scheduled_at === "string"
                ? new Date(c.scheduled_at)
                : c.scheduled_at?.toDate?.() ?? new Date()
              : new Date();

            const statusStyle = STATUS_STYLES[c.status];
            const TypeIcon =
              TYPE_ICONS[c.consultation_type || "video"] || Video;
            const otherPerson = isLawyer ? c.client_user : c.lawyer_user;

            return (
              <div key={c.id} className="border-b border-border-custom px-4 py-3 transition-colors hover:bg-black/[0.03]">
                <div className="flex items-start gap-3">
                  <div className="size-12 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                    {otherPerson?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-bold text-text-primary">
                          {otherPerson?.full_name || "User"}
                        </p>
                        <p className="text-[13px] text-muted-text">
                          {isLawyer ? "Client" : "Lawyer"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${statusStyle.bg} ${statusStyle.color}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {c.topic && (
                      <p className="mt-1.5 text-[14px] text-text-primary line-clamp-1">
                        {c.topic}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted-text">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(scheduledAt, "MMM d, yyyy")}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(scheduledAt, "h:mm a")}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TypeIcon className="size-3" />
                        {c.consultation_type || "General"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {c.duration_minutes || 30} min
                      </span>
                    </div>

                    {/* Actions for lawyers on pending consultations */}
                    {isLawyer && c.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          disabled={processing === c.id}
                          onClick={() => updateStatus(c.id, "confirmed")}
                          className="inline-flex h-8 items-center rounded-full bg-[#00BA7C] px-4 text-[13px] font-bold text-white hover:bg-[#00BA7C]/90 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Confirm
                        </button>
                        <button
                          disabled={processing === c.id}
                          onClick={() => updateStatus(c.id, "cancelled")}
                          className="inline-flex h-8 items-center rounded-full border border-[#F4212E]/30 px-4 text-[13px] font-bold text-[#F4212E] hover:bg-[#F4212E]/5 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="size-3.5 mr-1" />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Mark complete for confirmed consultations */}
                    {isLawyer && c.status === "confirmed" && (
                      <div className="mt-3">
                        <button
                          disabled={processing === c.id}
                          onClick={() => updateStatus(c.id, "completed")}
                          className="inline-flex h-8 items-center rounded-full border border-border-custom px-4 text-[13px] font-bold text-text-primary hover:bg-[#EFF3F4] disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Mark Completed
                        </button>
                      </div>
                    )}

                    {/* Leave review for completed consultations (clients) */}
                    {!isLawyer && c.status === "completed" && (
                      <div className="mt-3">
                        <Link
                          href={`/consultations/${c.id}/review`}
                          className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-dark"
                        >
                          <Star className="size-3.5" />
                          Leave a Review
                        </Link>
                      </div>
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
