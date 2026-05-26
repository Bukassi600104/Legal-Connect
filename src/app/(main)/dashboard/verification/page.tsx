"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import {
  ArrowLeft,
  BadgeCheck,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import type { VerificationRequest } from "@/types";

export const dynamic = "force-dynamic";

export default function VerificationPage() {
  const { user, lawyerProfile, loading: authLoading } = useAuth();
  const [existingRequest, setExistingRequest] =
    useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [scn, setScn] = useState(lawyerProfile?.scn || "");
  const [callToBarCert, setCallToBarCert] = useState<File | null>(null);
  const [practicingFee, setPracticingFee] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function checkExisting() {
      try {
        const q = query(
          collection(db, "verification_requests"),
          where("lawyer_id", "==", user!.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const latest = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as VerificationRequest))
            .sort((a, b) => {
              const aDate =
                typeof a.submitted_at === "string"
                  ? new Date(a.submitted_at)
                  : a.submitted_at?.toDate?.() ?? new Date();
              const bDate =
                typeof b.submitted_at === "string"
                  ? new Date(b.submitted_at)
                  : b.submitted_at?.toDate?.() ?? new Date();
              return bDate.getTime() - aDate.getTime();
            })[0];
          setExistingRequest(latest);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    void checkExisting();
  }, [user, authLoading]);

  async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !callToBarCert || !practicingFee || !idDocument || submitting)
      return;

    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const [certUrl, feeUrl, idUrl] = await Promise.all([
        uploadFile(callToBarCert, `verification/${user.uid}/call_to_bar_${timestamp}`),
        uploadFile(practicingFee, `verification/${user.uid}/practicing_fee_${timestamp}`),
        uploadFile(idDocument, `verification/${user.uid}/id_document_${timestamp}`),
      ]);

      await addDoc(collection(db, "verification_requests"), {
        lawyer_id: user.uid,
        scn: scn.trim(),
        call_to_bar_cert_url: certUrl,
        practicing_fee_receipt_url: feeUrl,
        id_document_url: idUrl,
        status: "pending",
        submitted_at: serverTimestamp(),
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error submitting verification:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || (user && loading)) return <PageLoader />;

  if (!user) return null;

  const isVerified = lawyerProfile?.verification_status === "verified";
  const isPending =
    existingRequest?.status === "pending" ||
    lawyerProfile?.verification_status === "pending";

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
        <h1 className="text-xl font-extrabold text-text-primary">Verification</h1>
      </div>

      {/* Status banner */}
      <div className="px-4 py-4 border-b border-border-custom">
        <div className="flex items-center gap-3">
          {isVerified ? (
            <>
              <div className="size-12 rounded-full bg-[#00BA7C]/10 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-[#00BA7C]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#00BA7C]">
                  Profile Verified
                </p>
                <p className="text-[13px] text-muted-text">
                  Your credentials have been verified.
                </p>
              </div>
            </>
          ) : isPending ? (
            <>
              <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Clock className="size-6 text-brand" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-brand">
                  Verification Pending
                </p>
                <p className="text-[13px] text-muted-text">
                  Your documents are being reviewed. Usually takes 1-3 business days.
                </p>
              </div>
            </>
          ) : existingRequest?.status === "rejected" ? (
            <>
              <div className="size-12 rounded-full bg-[#F4212E]/10 flex items-center justify-center">
                <XCircle className="size-6 text-[#F4212E]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#F4212E]">
                  Verification Rejected
                </p>
                <p className="text-[13px] text-muted-text">
                  {existingRequest.review_notes ||
                    "Your submission was rejected. Please resubmit with valid documents."}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="size-12 rounded-full bg-[#EFF3F4] flex items-center justify-center">
                <BadgeCheck className="size-6 text-muted-text" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-text-primary">
                  Not Verified
                </p>
                <p className="text-[13px] text-muted-text">
                  Submit your credentials to get the verified badge.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submission form */}
      {!isVerified && !isPending && !success && (
        <form onSubmit={handleSubmit} className="divide-y divide-border-custom">
          <div className="px-4 py-4 space-y-3">
            <h3 className="text-[15px] font-bold text-text-primary">Submit Documents</h3>

            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">
                Supreme Court Enrollment Number (SCN)
              </label>
              <Input
                value={scn}
                onChange={(e) => setScn(e.target.value)}
                placeholder="SC/12345"
                required
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">
                Call to Bar Certificate
              </label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCallToBarCert(e.target.files?.[0] || null)}
                required
                className="h-[38px] rounded-lg border-border-custom text-[13px]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">
                Current Practising Fee Receipt
              </label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setPracticingFee(e.target.files?.[0] || null)}
                required
                className="h-[38px] rounded-lg border-border-custom text-[13px]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-muted-text block mb-1">
                Valid Government-Issued ID
              </label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                required
                className="h-[38px] rounded-lg border-border-custom text-[13px]"
              />
              <p className="mt-1 text-[11px] text-muted-text">
                NIN slip, International Passport, or Driver&apos;s License
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <button
              type="submit"
              disabled={!scn || !callToBarCert || !practicingFee || !idDocument || submitting}
              className="w-full h-[44px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="size-4" />
                  Submit for Verification
                </span>
              )}
            </button>
          </div>
        </form>
      )}

      {success && (
        <div className="px-8 py-16 text-center">
          <CheckCircle2 className="size-12 text-[#00BA7C] mx-auto" />
          <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
            Documents Submitted!
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            We&apos;ll review your documents within 1-3 business days.
          </p>
        </div>
      )}
    </div>
  );
}
