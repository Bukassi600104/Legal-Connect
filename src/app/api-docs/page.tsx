import Link from "next/link";
import { KeyRound, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "API and Partner Access",
  description:
    "Partner access information for LegalConnect NG marketplace integrations.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <KeyRound className="size-6" />
        </div>
        <h1 className="mt-5 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[44px]">
          API and partner access
        </h1>
        <p className="mt-3 text-[17px] leading-7 text-muted-text">
          LegalConnect NG does not expose an open public API for general use.
          Integrations for institutions, law firms, bar associations, and
          verified partners are reviewed directly so user data, legal workflows,
          and platform trust controls stay protected.
        </p>

        <div className="mt-8 divide-y divide-border-custom rounded-lg border border-border-custom">
          <section className="p-5">
            <ShieldCheck className="size-6 text-brand" />
            <h2 className="mt-3 text-[18px] font-extrabold text-text-primary">
              Security-first review
            </h2>
            <p className="mt-1 text-[15px] leading-7 text-muted-text">
              Partner access should define data scope, authentication model,
              audit needs, retention expectations, and user consent boundaries.
            </p>
          </section>
          <section className="p-5">
            <Mail className="size-6 text-brand" />
            <h2 className="mt-3 text-[18px] font-extrabold text-text-primary">
              Partner enquiries
            </h2>
            <p className="mt-1 text-[15px] leading-7 text-muted-text">
              Use the help page to start a product or partnership conversation.
              Include the intended workflow, organization type, and data access
              requirements.
            </p>
            <Link
              href="/help"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark"
            >
              Contact Support
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
