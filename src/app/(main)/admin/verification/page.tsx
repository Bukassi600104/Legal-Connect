"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  BadgeCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { VerificationRequest, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

interface VerificationWithLawyer extends VerificationRequest {
  lawyer?: UserProfile;
}

export default function VerificationQueuePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationWithLawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationWithLawyer | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "verification_requests"),
        where("status", "==", filter),
        orderBy("submitted_at", "desc")
      );

      const snap = await getDocs(q);
      const reqs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as VerificationRequest)
      );

      const hydrated: VerificationWithLawyer[] = await Promise.all(
        reqs.map(async (req) => {
          let lawyer: UserProfile | undefined;
          try {
            const userDoc = await getDoc(doc(db, "users", req.lawyer_id));
            if (userDoc.exists()) {
              lawyer = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            }
          } catch {}
          return { ...req, lawyer };
        })
      );

      setRequests(hydrated);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(
    request: VerificationWithLawyer,
    decision: "approved" | "rejected"
  ) {
    if (!user || processing) return;
    setProcessing(true);

    try {
      await updateDoc(doc(db, "verification_requests", request.id), {
        status: decision,
        reviewed_by: user.uid,
        review_notes: reviewNotes || null,
        reviewed_at: serverTimestamp(),
      });

      const newVerifStatus =
        decision === "approved" ? "verified" : "rejected";
      await updateDoc(doc(db, "lawyer_profiles", request.lawyer_id), {
        verification_status: newVerifStatus,
        verification_date: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setSelectedRequest(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error processing verification:", error);
    } finally {
      setProcessing(false);
    }
  }

  const filterButtons = [
    { label: "Pending", value: "pending" as const },
    { label: "Approved", value: "approved" as const },
    { label: "Rejected", value: "rejected" as const },
  ];

  return (
    <div>
      {/* Filter pills */}
      <div className="px-4 py-3 border-b border-border-custom flex gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors",
              filter === btn.value
                ? "bg-text-primary text-white"
                : "border border-border-custom text-text-primary hover:bg-[#EFF3F4]"
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <BadgeCheck className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            No {filter} requests
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            {filter === "pending"
              ? "All verification requests have been reviewed."
              : `No ${filter} verification requests found.`}
          </p>
        </div>
      ) : (
        <div>
          {requests.map((req) => {
            const submittedAt = req.submitted_at
              ? typeof req.submitted_at === "string"
                ? new Date(req.submitted_at)
                : req.submitted_at?.toDate?.() ?? new Date()
              : new Date();

            return (
              <div
                key={req.id}
                className="px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="size-12 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[17px]">
                    {req.lawyer?.full_name?.charAt(0)?.toUpperCase() || "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-bold text-text-primary">
                        {req.lawyer?.full_name || "Unknown Lawyer"}
                      </p>
                      <span className={cn(
                        "text-[12px] font-bold rounded-full px-2.5 py-0.5",
                        req.status === "pending" && "bg-brand/10 text-brand",
                        req.status === "approved" && "bg-[#00BA7C]/10 text-[#00BA7C]",
                        req.status === "rejected" && "bg-[#F4212E]/10 text-[#F4212E]"
                      )}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-text">SCN: {req.scn}</p>
                    <p className="text-[13px] text-muted-text">
                      {submittedAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    {/* Document links */}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {req.call_to_bar_cert_url && (
                        <a
                          href={req.call_to_bar_cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-brand hover:text-brand-dark"
                        >
                          <ExternalLink className="size-3" />
                          Certificate
                        </a>
                      )}
                      {req.practicing_fee_receipt_url && (
                        <a
                          href={req.practicing_fee_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-brand hover:text-brand-dark"
                        >
                          <ExternalLink className="size-3" />
                          Fee Receipt
                        </a>
                      )}
                      {req.id_document_url && (
                        <a
                          href={req.id_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-brand hover:text-brand-dark"
                        >
                          <ExternalLink className="size-3" />
                          ID Document
                        </a>
                      )}
                    </div>

                    {req.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setReviewNotes(req.review_notes || "");
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-dark"
                      >
                        <FileText className="size-3.5" />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setReviewNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Review — {selectedRequest?.lawyer?.full_name || "Lawyer"}
            </DialogTitle>
            <DialogDescription>
              SCN: {selectedRequest?.scn}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                className="w-full resize-none rounded-lg border border-border-custom bg-transparent p-3 text-[14px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {selectedRequest?.status === "pending" && (
              <>
                <button
                  disabled={processing}
                  onClick={() =>
                    selectedRequest && handleReview(selectedRequest, "rejected")
                  }
                  className="h-9 px-4 rounded-full border border-[#F4212E]/30 text-[14px] font-bold text-[#F4212E] hover:bg-[#F4212E]/5 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="size-4 inline mr-1" />
                  Reject
                </button>
                <button
                  disabled={processing}
                  onClick={() =>
                    selectedRequest && handleReview(selectedRequest, "approved")
                  }
                  className="h-9 px-4 rounded-full bg-[#00BA7C] text-[14px] font-bold text-white hover:bg-[#00BA7C]/90 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="size-4 inline mr-1" />
                  Approve
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
