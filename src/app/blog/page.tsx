import Link from "next/link";
import { BookOpen, Hash, Search } from "lucide-react";

export const metadata = {
  title: "Legal Insights",
  description:
    "Browse legal insights, posts, and trending topics from lawyers on LegalConnect NG.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <BookOpen className="size-6" />
        </div>
        <h1 className="mt-5 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[44px]">
          Legal insights from the marketplace
        </h1>
        <p className="mt-3 text-[17px] leading-7 text-muted-text">
          LegalConnect NG publishes expertise through lawyer posts, topic feeds,
          and marketplace profiles. Start with the live feed or browse trending
          legal conversations.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/feed"
            className="rounded-lg border border-border-custom p-5 transition-colors hover:bg-[#F7F9F9]"
          >
            <Hash className="size-6 text-brand" />
            <h2 className="mt-4 text-[18px] font-extrabold text-text-primary">
              Read the legal feed
            </h2>
            <p className="mt-1 text-[15px] leading-6 text-muted-text">
              Follow short-form legal posts, opinions, rights education, and
              practical guidance from lawyers.
            </p>
          </Link>
          <Link
            href="/explore"
            className="rounded-lg border border-border-custom p-5 transition-colors hover:bg-[#F7F9F9]"
          >
            <Search className="size-6 text-brand" />
            <h2 className="mt-4 text-[18px] font-extrabold text-text-primary">
              Find specialists
            </h2>
            <p className="mt-1 text-[15px] leading-6 text-muted-text">
              Use expertise, state, availability, verification, and fee signals
              to evaluate lawyers.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
