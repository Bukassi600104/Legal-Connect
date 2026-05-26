"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
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

export function RightSidebar() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<SuggestedLawyer[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    // Fetch trending hashtags
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
                ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || "General Practice",
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
    <aside className="hidden lg:flex lg:w-[350px] lg:flex-col lg:gap-4 lg:py-2 lg:pl-6 lg:pr-6">
      {/* Search bar */}
      <div className="sticky top-0 bg-white pt-1 pb-3 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-text" />
          <Input
            type="search"
            placeholder="Search LegalConnect"
            className="h-[42px] rounded-full border-0 bg-[#EFF3F4] pl-11 pr-4 text-[15px] placeholder:text-muted-text focus-visible:ring-1 focus-visible:ring-brand focus-visible:bg-white focus-visible:border focus-visible:border-brand"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value;
                if (val) window.location.href = `/explore?q=${encodeURIComponent(val)}`;
              }
            }}
          />
        </div>
      </div>

      {/* Trending — dynamic from hashtag_counts */}
      <div className="rounded-2xl bg-[#F7F9F9] overflow-hidden">
        <h3 className="px-4 pt-3 pb-2 text-xl font-extrabold text-text-primary">
          Trending
        </h3>
        {displayTopics.map((topic) => (
          <Link
            key={topic.tag}
            href={`/hashtag/${topic.tag}`}
            className="flex flex-col px-4 py-3 transition-colors hover:bg-black/[0.03]"
          >
            <span className="text-[13px] text-muted-text">
              Trending in Legal
            </span>
            <span className="text-[15px] font-bold text-text-primary">
              #{topic.tag}
            </span>
            <span className="text-[13px] text-muted-text">
              {topic.count.toLocaleString()} posts
            </span>
          </Link>
        ))}
        <Link
          href="/explore"
          className="block px-4 py-3 text-[15px] text-brand hover:bg-black/[0.03] transition-colors"
        >
          Show more
        </Link>
      </div>

      {/* Who to follow — X style */}
      {user && lawyers.length > 0 && (
        <div className="rounded-2xl bg-[#F7F9F9] overflow-hidden">
          <h3 className="px-4 pt-3 pb-2 text-xl font-extrabold text-text-primary">
            Who to follow
          </h3>
          {lawyers.map((lawyer) => (
            <Link
              key={lawyer.id}
              href={lawyer.handle ? `/profile/${lawyer.handle}` : `/lawyer/${lawyer.slug}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03]"
            >
              {lawyer.avatar_url ? (
                <OptimizedAvatar
                  src={lawyer.avatar_url}
                  alt={lawyer.full_name}
                  className="size-10"
                />
              ) : (
                <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
                  {lawyer.full_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[15px] font-bold text-text-primary truncate">
                    {lawyer.full_name}
                  </span>
                  {lawyer.is_premium && <PremiumBadge size="sm" />}
                  {lawyer.verified && (
                    <VerificationBadge status="verified" size="sm" />
                  )}
                </div>
                <span className="text-[13px] text-muted-text truncate block">
                  {lawyer.handle ? `@${lawyer.handle}` : lawyer.specialization}
                </span>
              </div>
              <span className="shrink-0 inline-flex h-8 items-center rounded-full bg-text-primary px-4 text-sm font-bold text-white hover:bg-text-primary/90">
                Follow
              </span>
            </Link>
          ))}
          <Link
            href="/explore"
            className="block px-4 py-3 text-[15px] text-brand hover:bg-black/[0.03] transition-colors"
          >
            Show more
          </Link>
        </div>
      )}

      {/* Footer links — X-style */}
      <div className="px-4 text-[13px] text-muted-text">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/cookies" className="hover:underline">Cookies</Link>
          <Link href="/help" className="hover:underline">Help</Link>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} LegalConnect NG</p>
      </div>
    </aside>
  );
}
