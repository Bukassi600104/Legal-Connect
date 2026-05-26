"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  Users,
  Hash,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { TierBadge } from "@/components/shared/tier-badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { NIGERIAN_STATES, SPECIALIZATION_SEEDS } from "@/types";
import type { LawyerProfile, UserProfile } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ExploreTab = "lawyers" | "people" | "hashtags";

interface LawyerWithUser extends LawyerProfile {
  userProfile?: UserProfile;
}

interface HashtagResult {
  tag: string;
  count: number;
}

const POPULAR_SPECIALIZATIONS = [
  "Corporate Law",
  "Property Law",
  "Family Law",
  "Criminal Defense",
  "Employment Law",
];

function toSpecializationSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function formatNairaValue(value?: number) {
  if (value == null) return null;
  return `NGN ${value.toLocaleString("en-NG")}`;
}

function getSpecializationName(slug: string) {
  return (
    SPECIALIZATION_SEEDS.find((spec) => spec.slug === slug)?.name ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function getMarketplaceScore(lawyer: LawyerWithUser) {
  const tierScore =
    lawyer.subscription_tier === "elite"
      ? 30
      : lawyer.subscription_tier === "professional"
        ? 18
        : 0;
  const verificationScore =
    lawyer.verification_status === "verified" ? 25 : 0;
  const availabilityScore =
    lawyer.availability_status === "accepting" ? 15 : 0;

  return (
    tierScore +
    verificationScore +
    availabilityScore +
    (lawyer.rating_avg || 0) * 5 +
    Math.min(lawyer.rating_count || 0, 20)
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ExploreTab>("lawyers");
  const [lawyers, setLawyers] = useState<LawyerWithUser[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [hashtags, setHashtags] = useState<HashtagResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [stateFilter, setStateFilter] = useState(
    searchParams.get("state") || ""
  );
  const [specFilter, setSpecFilter] = useState(
    searchParams.get("specialization") || ""
  );
  const [showFilters, setShowFilters] = useState(false);

  // Fetch lawyers
  useEffect(() => {
    if (activeTab !== "lawyers") return;
    fetchLawyers();
  }, [stateFilter, specFilter, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch people
  useEffect(() => {
    if (activeTab !== "people") return;
    fetchPeople();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch hashtags
  useEffect(() => {
    if (activeTab !== "hashtags") return;
    fetchHashtags();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLawyers() {
    setLoading(true);
    try {
      let q = query(
        collection(db, "lawyer_profiles"),
        firestoreLimit(50)
      );

      if (stateFilter) {
        q = query(
          collection(db, "lawyer_profiles"),
          where("location_state", "==", stateFilter),
          firestoreLimit(50)
        );
      }

      const snapshot = await getDocs(q);
      const profiles = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as LawyerProfile)
      );

      const { getDoc, doc: docRef } = await import("firebase/firestore");
      const lawyersWithUsers: LawyerWithUser[] = await Promise.all(
        profiles.map(async (profile) => {
          const userDoc = await getDoc(docRef(db, "users", profile.user_id));
          return {
            ...profile,
            userProfile: userDoc.exists()
              ? ({ id: userDoc.id, ...userDoc.data() } as UserProfile)
              : undefined,
          };
        })
      );

      let filtered = lawyersWithUsers;

      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.userProfile?.full_name?.toLowerCase().includes(sq) ||
            l.userProfile?.handle?.toLowerCase().includes(sq) ||
            l.bio?.toLowerCase().includes(sq) ||
            l.location_state?.toLowerCase().includes(sq) ||
            l.location_city?.toLowerCase().includes(sq)
        );
      }

      if (specFilter) {
        filtered = filtered.filter((l) =>
          l.specialization_ids.includes(toSpecializationSlug(specFilter))
        );
      }

      setLawyers(
        filtered.sort((a, b) => getMarketplaceScore(b) - getMarketplaceScore(a))
      );
    } catch (error) {
      console.error("Error fetching lawyers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPeople() {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), firestoreLimit(50));
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
      );

      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase();
        results = results.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(sq) ||
            u.handle?.toLowerCase().includes(sq) ||
            u.bio?.toLowerCase().includes(sq)
        );
      }

      setPeople(results);
    } catch (error) {
      console.error("Error fetching people:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHashtags() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "hashtag_counts"),
        orderBy("count", "desc"),
        firestoreLimit(30)
      );
      const snapshot = await getDocs(q);
      let results: HashtagResult[] = snapshot.docs.map((d) => ({
        tag: d.data().tag || d.id,
        count: d.data().count || 0,
      }));

      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase();
        results = results.filter((h) => h.tag.toLowerCase().includes(sq));
      }

      setHashtags(results);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "lawyers") fetchLawyers();
    else if (activeTab === "people") fetchPeople();
    else fetchHashtags();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStateFilter("");
    setSpecFilter("");
  };

  const hasActiveFilters = searchQuery || stateFilter || specFilter;

  const tabs: { label: string; value: ExploreTab }[] = [
    { label: "Lawyers", value: "lawyers" },
    { label: "People", value: "people" },
    { label: "Hashtags", value: "hashtags" },
  ];

  return (
    <div>
      {/* X-style sticky header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <h1 className="text-xl font-extrabold text-text-primary">Explore</h1>
          {activeTab === "lawyers" && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`size-9 flex items-center justify-center rounded-full transition-colors hover:bg-brand/10 ${
                showFilters ? "text-brand" : "text-muted-text"
              }`}
            >
              <SlidersHorizontal className="size-5" />
            </button>
          )}
        </div>

        {/* X-style search bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-text" />
            <input
              type="search"
              placeholder={
                activeTab === "lawyers"
                  ? "Search lawyers"
                  : activeTab === "people"
                  ? "Search people"
                  : "Search hashtags"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[42px] rounded-full bg-[#EFF3F4] pl-12 pr-4 text-[15px] text-text-primary placeholder:text-muted-text outline-none border border-transparent focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </form>
          {activeTab === "lawyers" && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {POPULAR_SPECIALIZATIONS.map((spec) => {
                const slug = toSpecializationSlug(spec);
                const selected = specFilter === slug;

                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSpecFilter(selected ? "" : slug)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-border-custom text-text-primary hover:bg-[#EFF3F4]"
                    )}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border-custom">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 py-3 text-[15px] font-medium text-center transition-colors relative hover:bg-black/[0.03]",
                activeTab === tab.value
                  ? "font-bold text-text-primary"
                  : "text-muted-text"
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel — only for lawyers tab */}
      {activeTab === "lawyers" && (
        <div className="grid grid-cols-3 border-b border-border-custom text-center">
          {[
            { label: "Verified profiles", value: "SCN/NBA" },
            { label: "Client-ready", value: "Chat + booking" },
            { label: "Transparent", value: "Fee ranges" },
          ].map((item) => (
            <div key={item.label} className="px-2 py-3">
              <p className="text-[13px] font-bold text-text-primary">
                {item.value}
              </p>
              <p className="text-[11px] text-muted-text">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "lawyers" && showFilters && (
        <div className="border-b border-border-custom px-4 py-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-text-primary">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[13px] font-medium text-brand hover:text-brand-dark"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-text">
                State
              </label>
              <Select
                value={stateFilter}
                onValueChange={(v) => setStateFilter(v ?? "")}
              >
                <SelectTrigger className="w-full h-9 rounded-lg border-border-custom text-[14px]">
                  <MapPin className="mr-2 size-3.5 text-muted-text" />
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-text">
                Specialization
              </label>
              <Select
                value={specFilter}
                onValueChange={(v) => setSpecFilter(v ?? "")}
              >
                <SelectTrigger className="w-full h-9 rounded-lg border-border-custom text-[14px]">
                  <SelectValue placeholder="All specializations" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATION_SEEDS.map((spec) => (
                    <SelectItem key={spec.slug} value={spec.slug}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills — only for lawyers tab */}
      {activeTab === "lawyers" && hasActiveFilters && (
        <div className="px-4 py-2 border-b border-border-custom flex flex-wrap gap-2">
          {stateFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[13px] font-medium text-brand">
              <MapPin className="size-3" />
              {stateFilter}
              <button
                onClick={() => setStateFilter("")}
                className="ml-0.5 hover:text-brand-dark"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {specFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[13px] font-medium text-brand">
              {SPECIALIZATION_SEEDS.find((s) => s.slug === specFilter)?.name ||
                specFilter}
              <button
                onClick={() => setSpecFilter("")}
                className="ml-0.5 hover:text-brand-dark"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 text-brand animate-spin" />
        </div>
      ) : (
        <>
          {/* Lawyers tab */}
          {activeTab === "lawyers" && (
            <>
              {lawyers.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <Users className="size-10 text-muted-text mx-auto mb-3" />
                  <h2 className="text-xl font-extrabold text-text-primary">
                    {hasActiveFilters ? "No results" : "No lawyers yet"}
                  </h2>
                  <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
                    {hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "No lawyer profiles have been created yet."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 inline-flex h-9 items-center rounded-full border border-border-custom px-5 text-[15px] font-bold text-text-primary hover:bg-[#E7E9EA] transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                lawyers.map((lawyer) => (
                  <LawyerRow key={lawyer.id} lawyer={lawyer} />
                ))
              )}
            </>
          )}

          {/* People tab */}
          {activeTab === "people" && (
            <>
              {people.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <Users className="size-10 text-muted-text mx-auto mb-3" />
                  <h2 className="text-xl font-extrabold text-text-primary">
                    {searchQuery ? "No results" : "No people yet"}
                  </h2>
                  <p className="mt-2 text-[15px] text-muted-text">
                    {searchQuery
                      ? "Try a different search term."
                      : "No users have joined yet."}
                  </p>
                </div>
              ) : (
                people.map((person) => (
                  <PersonRow key={person.id} person={person} />
                ))
              )}
            </>
          )}

          {/* Hashtags tab */}
          {activeTab === "hashtags" && (
            <>
              {hashtags.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <Hash className="size-10 text-muted-text mx-auto mb-3" />
                  <h2 className="text-xl font-extrabold text-text-primary">
                    {searchQuery ? "No results" : "No hashtags yet"}
                  </h2>
                  <p className="mt-2 text-[15px] text-muted-text">
                    {searchQuery
                      ? "Try a different search term."
                      : "No hashtags have been used yet."}
                  </p>
                </div>
              ) : (
                hashtags.map((ht) => (
                  <HashtagRow key={ht.tag} hashtag={ht} />
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function LawyerRow({ lawyer }: { lawyer: LawyerWithUser }) {
  const feeMin = formatNairaValue(lawyer.fee_range_min);
  const feeMax = formatNairaValue(lawyer.fee_range_max);
  const feeRange = feeMin ? `${feeMin}${feeMax ? ` - ${feeMax}` : "+"}` : null;
  const displaySpecializations =
    lawyer.specializations?.map((spec) => spec.name) ||
    lawyer.specialization_ids.map(getSpecializationName);

  return (
    <Link
      href={`/lawyer/${lawyer.slug}`}
      className="flex items-start gap-3 px-4 py-3 border-b border-border-custom transition-colors hover:bg-black/[0.03]"
    >
      {/* Avatar */}
      {lawyer.userProfile?.avatar_url ? (
        <OptimizedAvatar
          src={lawyer.userProfile.avatar_url}
          alt={lawyer.userProfile.full_name}
          className="size-12"
          sizes="48px"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[17px]">
          {lawyer.userProfile?.full_name?.charAt(0)?.toUpperCase() || "L"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[15px] font-bold text-text-primary truncate">
            {lawyer.userProfile?.full_name || "Lawyer"}
          </span>
          {lawyer.userProfile?.is_premium && <PremiumBadge size="sm" />}
          {lawyer.verification_status === "verified" && (
            <ShieldCheck className="size-[18px] text-brand shrink-0" />
          )}
          <TierBadge tier={lawyer.subscription_tier} size="sm" />
        </div>

        <p className="text-[13px] text-muted-text mt-0.5 truncate">
          @{lawyer.userProfile?.handle || lawyer.slug}
        </p>

        <div className="flex items-center gap-2 text-[13px] text-muted-text mt-0.5">
          {lawyer.location_state && (
            <span className="flex items-center gap-0.5">
              <MapPin className="size-3" />
              {lawyer.location_state}
              {lawyer.location_city && `, ${lawyer.location_city}`}
            </span>
          )}
          {lawyer.years_of_experience != null && (
            <span>· {lawyer.years_of_experience} yrs</span>
          )}
        </div>

        {displaySpecializations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {displaySpecializations.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="rounded-full bg-[#EFF3F4] px-2 py-0.5 text-[12px] font-medium text-text-primary"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {lawyer.bio && (
          <p className="mt-1 text-[15px] text-text-primary line-clamp-2 leading-5">
            {lawyer.bio}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {lawyer.rating_avg > 0 && (
            <span className="flex items-center gap-1 text-[13px] text-muted-text">
              <Star className="size-3.5 fill-brand text-brand" />
              {lawyer.rating_avg.toFixed(1)}
            </span>
          )}
          <span
            className={`flex items-center gap-1 text-[13px] font-medium ${
              lawyer.availability_status === "accepting"
                ? "text-[#00BA7C]"
                : "text-muted-text"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                lawyer.availability_status === "accepting"
                  ? "bg-[#00BA7C]"
                  : "bg-muted-text"
              }`}
            />
            {lawyer.availability_status === "accepting"
              ? "Available"
              : "Unavailable"}
          </span>
          {feeRange && (
            <span className="text-[13px] font-medium text-text-primary">
              {feeRange}
            </span>
          )}
        </div>
      </div>

      {/* View button */}
      <span className="shrink-0 mt-1 h-8 px-4 rounded-full bg-text-primary text-white text-[13px] font-bold hover:bg-text-primary/90 transition-colors inline-flex items-center">
        View
      </span>
    </Link>
  );
}

function PersonRow({ person }: { person: UserProfile }) {
  return (
    <Link
      href={person.handle ? `/profile/${person.handle}` : "#"}
      className="flex items-center gap-3 px-4 py-3 border-b border-border-custom transition-colors hover:bg-black/[0.03]"
    >
      {/* Avatar */}
      {person.avatar_url ? (
        <OptimizedAvatar
          src={person.avatar_url}
          alt={person.full_name}
          className="size-12"
          sizes="48px"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[17px]">
          {person.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[15px] font-bold text-text-primary truncate">
            {person.full_name}
          </span>
          {person.is_premium && <PremiumBadge size="sm" />}
        </div>
        <p className="text-[13px] text-muted-text truncate">
          {person.handle ? `@${person.handle}` : ""}{" "}
          {person.role === "lawyer" ? "· Lawyer" : ""}
        </p>
        {person.bio && (
          <p className="mt-1 text-[15px] text-text-primary line-clamp-2 leading-5">
            {person.bio}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[13px] text-muted-text">
          <span>{person.follower_count || 0} followers</span>
          <span>{person.post_count || 0} posts</span>
        </div>
      </div>

      {/* Follow button */}
      <span className="shrink-0 h-8 px-4 rounded-full bg-text-primary text-white text-[13px] font-bold hover:bg-text-primary/90 transition-colors inline-flex items-center">
        Follow
      </span>
    </Link>
  );
}

function HashtagRow({ hashtag }: { hashtag: HashtagResult }) {
  return (
    <Link
      href={`/hashtag/${hashtag.tag}`}
      className="flex flex-col px-4 py-3 border-b border-border-custom transition-colors hover:bg-black/[0.03]"
    >
      <span className="text-[13px] text-muted-text">Trending in Legal</span>
      <span className="text-[15px] font-bold text-text-primary">
        #{hashtag.tag}
      </span>
      <span className="text-[13px] text-muted-text">
        {hashtag.count.toLocaleString()} posts
      </span>
    </Link>
  );
}
