import Link from "next/link";
import { Briefcase, BadgeCheck, BarChart3, Users } from "lucide-react";

export const metadata = {
  title: "For Law Firms",
  description:
    "How LegalConnect NG helps Nigerian law firms build visibility, capture leads, and manage trust signals.",
};

const firmBenefits = [
  {
    icon: BadgeCheck,
    title: "Credential-led trust",
    description:
      "Showcase verified lawyers, practice areas, NBA branch details, years of experience, and client-facing fee guidance.",
  },
  {
    icon: Users,
    title: "Marketplace discovery",
    description:
      "Appear where clients search by specialization, state, availability, ratings, and professional signals.",
  },
  {
    icon: BarChart3,
    title: "Growth tooling",
    description:
      "Use premium placement, profile analytics, posts, and direct messages to turn legal expertise into measurable demand.",
  },
];

export default function ForFirmsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-border-custom px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Briefcase className="size-6" />
          </div>
          <h1 className="mt-5 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[44px]">
            Build your firm&apos;s digital front door
          </h1>
          <p className="mt-3 text-[17px] leading-7 text-muted-text">
            LegalConnect NG helps law firms and independent lawyers become easier
            to discover, evaluate, and contact while preserving professional
            credibility.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup/lawyer"
              className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark"
            >
              Join as a Lawyer
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center rounded-full border border-border-custom px-5 text-[15px] font-bold text-text-primary hover:bg-[#EFF3F4]"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-4 py-8">
        {firmBenefits.map((benefit) => (
          <article
            key={benefit.title}
            className="flex gap-4 border-b border-border-custom pb-5 last:border-b-0"
          >
            <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <benefit.icon className="size-5" />
            </div>
            <div>
              <h2 className="text-[19px] font-extrabold text-text-primary">
                {benefit.title}
              </h2>
              <p className="mt-1 text-[15px] leading-7 text-muted-text">
                {benefit.description}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
