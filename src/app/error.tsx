"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#F4212E]/10">
          <AlertTriangle className="size-8 text-[#F4212E]" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-text-primary">
          Something went wrong
        </h2>
        <p className="mt-2 text-[15px] text-muted-text">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
