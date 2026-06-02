"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Input } from "@/components/ui/input";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { useAuth } from "@/components/providers/auth-provider";

interface TrendingTopic {
  tag: string;
  count: number;
}

interface SuggestedLawyer {
  id: string;
  full_name: string;
  handle: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  specialization: string;
  verified: boolean;
  slug: string;
}

const FALLBACK_TOPICS: TrendingTopic[] = [
  { tag: "corporatelaw", count: 1284 },
  { tag: "landuseact", count: 945 },
  { tag: "humanrights", count: 762 },
  { tag: "criminallaw", count: 651 },
  { tag: "taxlaw", count: 523 },
];

const TRUST_ITEMS = [
  "Verified lawyer profiles",
  "Secure consultation requests",
  "Admin-reviewed marketplace activity",
];

export function RightSidebar() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<SuggestedLawyer[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const q = query(
          collection(db, "hashtag_counts"),
          orderBy("count", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const results: TrendingTopic[] = snapshot.docs.map((d) => ({
          tag: d.data().tag || d.id,
          count: d.data().count || 0,
        }));
        setTrending(results.length > 0 ? results : FALLBACK_TOPICS);
      } catch {
        setTrending(FALLBACK_TOPICS);
      }
    }

    fetchTrending();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchLawyers() {
      try {
        const q = query(
          collection(db, "lawyer_profiles"),
          orderBy("rating_avg", "desc"),
          limit(3)
        );
        const snapshot = await getDocs(q);

        const { getDoc, doc: docRef } = await import("firebase/firestore");

        const results: SuggestedLawyer[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const userDoc = await getDoc(docRef(db, "users", data.user_id));
          const userData = userDoc.exists() ? userDoc.data() : null;

          results.push({
            id: docSnap.id,
            full_name: userData?.full_name || "Lawyer",
            handle: userData?.handle || null,
            avatar_url: userData?.avatar_url || null,
            is_premium: userData?.is_premium || false,
            specialization:
              data.specialization_ids?.[0]
                ?.replace(/-/g, " ")
                ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
              "General Practice",
            verified: data.verification_status === "verified",
            slug: data.slug,
          });
        }
        setLawyers(results);
      } catch (error) {
        console.error("Error fetching suggested lawyers:", error);
      }
    }

    fetchLawyers();
  }, [user]);

  const displayTopics = trending.length > 0 ? trending : FALLBACK_TOPICS;

  return (
    <aside className="hidden lg:block lg:py-4">
      <div className="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col gap-4 overflow-y-auto pr-1">
        <div className="rounded-lg border border-border-custom bg-white p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-text" />
            <Input
              type="search"
              placeholder="Search lawyers, topics, cases"
              className="h-11 rounded-lg border-border-custom bg-[#F8FAFC] pl-10 pr-3 text-[14px] placeholder:text-muted-text focus-visible:border-brand focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-brand/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) {
                    window.location.href = `/explore?q=${encodeURIComponent(val)}`;
                  }
                }
              }}
            />
          </div>
        </div>

        <section className="rounded-lg border border-border-custom bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <h3 className="text-[16px] font-black text-text-primary">
              Legal radar
            </h3>
          </div>
          <div className="mt-3 divide-y divide-border-custom">
            {displayTopics.map((topic) => (
              <Link
                key={topic.tag}
                href={`/hashtag/${topic.tag}`}
                className="block py-3 transition-colors hover:text-brand"
              >
                <span className="block text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-text">
                  Active discussion
                </span>
                <span className="block text-[15px] font-bold text-text-primary">
                  #{topic.tag}
                </span>
                <span className="block text-[13px] text-muted-text">
                  {topic.count.toLocaleString()} briefings
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/explore"
            className="mt-2 inline-flex h-9 items-center rounded-lg border border-brand/20 px-3 text-[14px] font-bold text-brand transition-colors hover:bg-brand-light"
          >
            Open marketplace
          </Link>
        </section>

        {user && lawyers.length > 0 && (
          <section className="rounded-lg border border-border-custom bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand" />
              <h3 className="text-[16px] font-black text-text-primary">
                Verified lawyers
              </h3>
            </div>
            <div className="mt-3 space-y-3">
              {lawyers.map((lawyer) => (
                <Link
                  key={lawyer.id}
                  href={
                    lawyer.handle
                      ? `/profile/${lawyer.handle}`
                      : `/lawyer/${lawyer.slug}`
                  }
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border-custom hover:bg-[#F8FAFC]"
                >
                  {lawyer.avatar_url ? (
                    <OptimizedAvatar
                      src={lawyer.avatar_url}
                      alt={lawyer.full_name}
                      className="size-10"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                      {lawyer.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-[14px] font-bold text-text-primary">
                        {lawyer.full_name}
                      </span>
                      {lawyer.is_premium && <PremiumBadge size="sm" />}
                      {lawyer.verified && (
                        <VerificationBadge status="verified" size="sm" />
                      )}
                    </div>
                    <span className="block truncate text-[12px] text-muted-text">
                      {lawyer.handle ? `@${lawyer.handle}` : lawyer.specialization}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white">
                    View
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-gold/20 bg-gold-light p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-gold" />
            <h3 className="text-[16px] font-black text-text-primary">
              Trust checklist
            </h3>
          </div>
          <ul className="mt-3 space-y-2">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-text-primary">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="px-1 pb-4 text-[13px] text-muted-text">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/terms" className="hover:text-brand">Terms</Link>
            <Link href="/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/cookies" className="hover:text-brand">Cookies</Link>
            <Link href="/help" className="hover:text-brand">Help</Link>
          </div>
          <p className="mt-2">&copy; {new Date().getFullYear()} LegalConnect NG</p>
        </div>
      </div>
    </aside>
  );
}
