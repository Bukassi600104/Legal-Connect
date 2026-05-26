"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!reference) return;

    // Give webhook time to process
    const timer = setTimeout(() => {
      setStatus("success");
    }, 2000);

    return () => clearTimeout(timer);
  }, [reference]);

  const displayStatus = reference ? status : "error";

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
