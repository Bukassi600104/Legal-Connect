"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@/hooks/use-auth-actions";

export default function ForgotPasswordPage() {
  const { resetPassword, loading, error, clearError } = useAuthActions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // Error handled by hook
    }
  };

  if (sent) {
    return (
      <div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#00BA7C]/10">
            <CheckCircle2 className="size-7 text-[#00BA7C]" />
          </div>
          <h1 className="text-[23px] font-extrabold text-text-primary">
            Check your email
          </h1>
          <p className="mt-3 text-[15px] text-muted-text max-w-xs mx-auto">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-text-primary">{email}</span>.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="w-full h-[42px] rounded-full border border-border-custom text-[15px] font-bold text-text-primary hover:bg-[#E7E9EA] transition-colors"
          >
            Try a different email
          </button>
          <Link
            href="/login"
            className="block text-center text-[15px] font-medium text-brand hover:underline"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-4 inline-flex items-center gap-1 text-[15px] text-muted-text hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <h1 className="text-[23px] font-extrabold text-text-primary">
        Reset your password
      </h1>
      <p className="mt-1 text-[15px] text-muted-text">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-[#F4212E]/10 px-4 py-3 text-[15px] text-[#F4212E]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
          required
          disabled={loading}
        />

        <button
          type="submit"
          className="w-full h-[42px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Sending...
            </span>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>
    </div>
  );
}
