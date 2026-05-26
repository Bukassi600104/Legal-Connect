"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  ArrowLeft,
  Calendar,
  Video,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import type {
  UserProfile,
  LawyerProfile,
  ConsultationType,
} from "@/types";

export const dynamic = "force-dynamic";

const CONSULTATION_TYPES: {
  value: ConsultationType;
  label: string;
  icon: typeof Video;
}[] = [
  { value: "video", label: "Video", icon: Video },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "in_person", label: "In Person", icon: MapPin },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hrs" },
  { value: 120, label: "2 hrs" },
];

export default function BookConsultationPage() {
  const params = useParams();
  const lawyerId = params.lawyerId as string;
  const { user } = useAuth();

  const [lawyerUser, setLawyerUser] = useState<UserProfile | null>(null);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [consultType, setConsultType] = useState<ConsultationType>("video");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchLawyer() {
      try {
        const [userDoc, profileDoc] = await Promise.all([
          getDoc(doc(db, "users", lawyerId)),
          getDoc(doc(db, "lawyer_profiles", lawyerId)),
        ]);

        if (userDoc.exists()) {
          setLawyerUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
        }
        if (profileDoc.exists()) {
          setLawyerProfile({ id: profileDoc.id, ...profileDoc.data() } as LawyerProfile);
        }
      } catch (error) {
        console.error("Error fetching lawyer:", error);
      } finally {
        setLoading(false);
      }
    }

    if (lawyerId) fetchLawyer();
  }, [lawyerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !date || !time || submitting) return;

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);

      let conversationId: string | undefined;
      const convoQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      );
      const convoSnap = await getDocs(convoQuery);
      const existingConvo = convoSnap.docs.find((d) => {
        const data = d.data();
        return data.participants?.includes(lawyerId);
      });

      if (existingConvo) {
        conversationId = existingConvo.id;
      }

      await addDoc(collection(db, "consultations"), {
        lawyer_id: lawyerId,
        client_id: user.uid,
        conversation_id: conversationId || null,
        consultation_type: consultType,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: "pending",
        topic: topic.trim() || null,
        notes: notes.trim() || null,
        created_at: serverTimestamp(),
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error booking consultation:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  if (success) {
    return (
      <div className="px-8 py-16 text-center">
        <CheckCircle2 className="size-12 text-[#00BA7C] mx-auto" />
        <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
          Consultation Booked!
        </h2>
        <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
          Your request has been sent to {lawyerUser?.full_name || "the lawyer"}.
          You&apos;ll be notified once confirmed.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/consultations"
            className="h-9 px-5 rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark transition-colors inline-flex items-center"
          >
            View Consultations
          </Link>
          <Link
            href="/explore"
            className="h-9 px-5 rounded-full border border-border-custom text-[15px] font-bold text-text-primary hover:bg-[#EFF3F4] transition-colors inline-flex items-center"
          >
            Explore
          </Link>
        </div>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href={lawyerProfile?.slug ? `/lawyer/${lawyerProfile.slug}` : "/explore"}
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-extrabold text-text-primary">Book Consultation</h1>
      </div>

      {/* Lawyer info */}
      <div className="px-4 py-4 border-b border-border-custom flex items-center gap-3">
        <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[17px]">
          {lawyerUser?.full_name?.charAt(0)?.toUpperCase() || "L"}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-bold text-text-primary">
              {lawyerUser?.full_name || "Lawyer"}
            </span>
            {lawyerProfile?.verification_status === "verified" && (
              <BadgeCheck className="size-[18px] text-brand" />
            )}
          </div>
          <p className="text-[13px] text-muted-text">
            {lawyerProfile?.location_state || "Nigeria"}
            {lawyerProfile?.years_of_experience &&
              ` · ${lawyerProfile.years_of_experience} yrs`}
          </p>
          {lawyerProfile?.fee_range_min && (
            <p className="text-[13px] font-medium text-brand">
              From ₦{lawyerProfile.fee_range_min.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} className="divide-y divide-border-custom">
        {/* Type */}
        <div className="px-4 py-4">
          <label className="text-[13px] font-medium text-muted-text block mb-2">
            Consultation Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONSULTATION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setConsultType(type.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors",
                  consultType === type.value
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-border-custom text-muted-text hover:border-brand/30"
                )}
              >
                <type.icon className="size-5" />
                <span className="text-[12px] font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="px-4 py-4">
          <label className="text-[13px] font-medium text-muted-text block mb-2">Duration</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[13px] font-bold transition-colors",
                  duration === opt.value
                    ? "border-brand bg-brand text-white"
                    : "border-border-custom text-text-primary hover:bg-[#EFF3F4]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic & Notes */}
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className="text-[13px] font-medium text-muted-text block mb-1">
              Topic / Subject
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Property dispute, Contract review"
              className="h-[38px] rounded-lg border-border-custom text-[14px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-muted-text block mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the lawyer should know..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border-custom bg-transparent p-3 text-[14px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="px-4 py-4">
          <button
            type="submit"
            disabled={!date || !time || submitting}
            className="w-full h-[44px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Booking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Calendar className="size-4" />
                Book Consultation
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
