"use client";

import Link from "next/link";
import { Scale, User, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-[31px] font-extrabold text-text-primary text-center">
        Join LegalConnect
      </h1>
      <p className="mt-2 text-center text-[15px] text-muted-text">
        Choose how you want to use the platform
      </p>

      <div className="mt-8 grid gap-3">
        {/* Client option */}
        <Link
          href="/signup/client"
          className="group flex items-center gap-4 rounded-2xl border border-border-custom p-4 transition-all hover:bg-[#F7F9F9]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/10">
            <User className="size-6 text-brand" />
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold text-text-primary">
              I need a Lawyer
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-text">
              Find verified lawyers and book consultations
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-text transition-transform group-hover:translate-x-1 group-hover:text-brand" />
        </Link>

        {/* Lawyer option */}
        <Link
          href="/signup/lawyer"
          className="group flex items-center gap-4 rounded-2xl border border-border-custom p-4 transition-all hover:bg-[#F7F9F9]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#00BA7C]/10">
            <Scale className="size-6 text-[#00BA7C]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold text-text-primary">
              I am a Lawyer
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-text">
              Build your presence and grow your practice
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-text transition-transform group-hover:translate-x-1 group-hover:text-brand" />
        </Link>
      </div>

      <p className="mt-6 text-center text-[15px] text-muted-text">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
