"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { GOOGLE_PENDING_KEY } from "@/lib/firebase/google-auth";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { signInWithGoogle, error } = useAuthActions();
  const [timedOut, setTimedOut] = useState(false);

  const redirectTo = searchParams.get("redirectTo") || "/feed";

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      router.replace(redirectTo);
      return;
    }

    const provider = searchParams.get("provider");
    if (provider !== "google") return;

    const pending = window.localStorage.getItem(GOOGLE_PENDING_KEY);
    const pendingStartedAt = pending ? Number(pending) : 0;
    const pendingIsFresh =
      Number.isFinite(pendingStartedAt) &&
      pendingStartedAt > 0 &&
      Date.now() - pendingStartedAt < 90_000;

    if (pending && pendingIsFresh) return;

    if (pending && !pendingIsFresh) {
      window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    }

    const role = searchParams.get("role") === "lawyer" ? "lawyer" : "client";

    void signInWithGoogle(role, redirectTo);
  }, [authLoading, redirectTo, router, searchParams, signInWithGoogle, user]);

  useEffect(() => {
    if (user) return;

    const timeout = window.setTimeout(() => {
      setTimedOut(true);
      window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    }, 20_000);

    return () => window.clearTimeout(timeout);
  }, [user]);

  const handleRetry = () => {
    setTimedOut(false);
    window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    const role = searchParams.get("role") === "lawyer" ? "lawyer" : "client";
    void signInWithGoogle(role, redirectTo);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Loader2 className="size-6 animate-spin" />
        </div>
        <h1 className="mt-5 text-[23px] font-black text-text-primary">
          Completing sign in
        </h1>
        <p className="mt-2 text-[15px] text-muted-text">
          {timedOut
            ? "Google did not return a completed session. Please try again."
            : "Please wait while LegalConnect finishes your Google session."}
        </p>
        {error && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-[14px] text-error">
            {error}
          </div>
        )}
        {timedOut && (
          <button
            onClick={handleRetry}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-bold text-white transition-colors hover:bg-brand-dark"
          >
            <RotateCcw className="size-4" />
            Try Google again
          </button>
        )}
        <Link
          href="/login"
          className="mt-5 inline-flex h-9 items-center rounded-lg border border-border-custom px-4 text-[14px] font-bold text-text-primary transition-colors hover:bg-[#F8FAFC]"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
