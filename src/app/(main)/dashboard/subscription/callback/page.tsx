"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "error"
  >(() => (reference ? "loading" : "error"));

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    let attempts = 0;

    async function verifyPayment() {
      attempts += 1;

      try {
        const response = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference!)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.status === "success") {
          setStatus("success");
          return;
        }

        if (data.status === "error") {
          setStatus("error");
          return;
        }

        if (attempts >= 8) {
          setStatus("pending");
          return;
        }

        setTimeout(verifyPayment, 1500);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  const displayStatus = status;

  return (
    <div className="px-8 py-16 text-center">
      {displayStatus === "loading" && (
        <>
          <Loader2 className="size-12 text-brand animate-spin mx-auto" />
          <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
            Processing Payment...
          </h2>
          <p className="mt-2 text-[15px] text-muted-text">
            Please wait while we confirm your payment.
          </p>
        </>
      )}

      {displayStatus === "success" && (
        <>
          <CheckCircle2 className="size-12 text-[#00BA7C] mx-auto" />
          <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
            Payment Successful!
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            Your subscription has been activated. Enjoy your premium features!
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            Go to Dashboard
          </Link>
        </>
      )}

      {displayStatus === "error" && (
        <>
          <XCircle className="size-12 text-[#F4212E] mx-auto" />
          <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
            Payment Failed
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            Something went wrong with your payment. Please try again.
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            Try Again
          </Link>
        </>
      )}

      {displayStatus === "pending" && (
        <>
          <Loader2 className="size-12 text-brand mx-auto" />
          <h2 className="mt-4 text-[23px] font-extrabold text-text-primary">
            Payment Received
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            We could not confirm activation yet. Please check your subscription
            page in a moment.
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            View Subscription
          </Link>
        </>
      )}
    </div>
  );
}

export default function SubscriptionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-16 text-center">
          <Loader2 className="size-8 text-brand animate-spin mx-auto" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
