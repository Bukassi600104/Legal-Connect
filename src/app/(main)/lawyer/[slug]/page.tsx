"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Star,
  MessageCircle,
  Calendar,
  Users,
  Globe,
  GraduationCap,
  Clock,
  ArrowLeft,
  BadgeCheck,
  LinkIcon,
} from "lucide-react";
import { query, where, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TierBadge } from "@/components/shared/tier-badge";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { CategoryPill } from "@/components/shared/category-pill";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { useFollow } from "@/hooks/use-follow";
import { cn } from "@/lib/utils";
import type { LawyerProfile, UserProfile, Post, Review } from "@/types";

export const dynamic = "force-dynamic";

type ProfileTab = "posts" | "about" | "reviews";

export default function LawyerProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(
    lawyer?.user_id ?? ""
  );
  const isOwnProfile = user?.uid === lawyer?.user_id;

  useEffect(() => {
    async function fetchLawyer() {
      try {
        const profilesQuery = query(
          collection(db, "lawyer_profiles"),
          where("slug", "==", slug)
        );
        const profileSnap = await getDocs(profilesQuery);

        if (profileSnap.empty) {
          setLoading(false);
          return;
        }

        const profileDoc = profileSnap.docs[0];
        const lawyerData = {
          id: profileDoc.id,
          ...profileDoc.data(),
        } as LawyerProfile;
        setLawyer(lawyerData);

        const { getDoc, doc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", lawyerData.user_id));
        if (userDoc.exists()) {
          setUserProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
        }

        const postsQuery = query(
          collection(db, "posts"),
          where("author_id", "==", lawyerData.user_id)
        );
        const postsSnap = await getDocs(postsQuery);
        setPosts(
          postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
        );

        try {
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("lawyer_id", "==", lawyerData.user_id)
          );
          const reviewsSnap = await getDocs(reviewsQuery);
          const reviewsData = await Promise.all(
            reviewsSnap.docs.map(async (d) => {
              const review = { id: d.id, ...d.data() } as Review;
              try {
                const { getDoc: gd, doc: dd } = await import("firebase/firestore");
                const clientDoc = await gd(dd(db, "users", review.client_id));
                if (clientDoc.exists()) {
                  review.client = { id: clientDoc.id, ...clientDoc.data() } as UserProfile;
                }
              } catch {}
              return review;
            })
          );
          setReviews(reviewsData);
        } catch {
          // Reviews collection may not exist yet
        }
      } catch (error) {
        console.error("Error fetching lawyer:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLawyer();
  }, [slug]);

  if (loading) return <PageLoader />;

  if (!lawyer || !userProfile) {
    return (
      <div className="px-8 py-16 text-center">
        <Users className="size-10 text-muted-text mx-auto mb-3" />
        <h2 className="text-[31px] font-extrabold text-text-primary">
          Profile not found
        </h2>
        <p className="mt-2 text-[15px] text-muted-text">
          This lawyer profile doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/explore"
          className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          Browse Lawyers
        </Link>
      </div>
    );
  }

  const tabs: { label: string; value: ProfileTab; count?: number }[] = [
    { label: "Posts", value: "posts", count: posts.length },
    { label: "About", value: "about" },
    { label: "Reviews", value: "reviews", count: lawyer.rating_count },
  ];

  return (
    <div>
      {/* X-style header with back arrow */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href="/explore"
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-[17px] font-extrabold text-text-primary leading-tight">
              {userProfile.full_name}
            </h1>
            {userProfile.is_premium && <PremiumBadge size="sm" />}
          </div>
          <p className="text-[13px] text-muted-text">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Banner / cover image */}
      <div className="h-[200px] bg-brand/20 relative z-[1]">
        {lawyer.cover_image_url ? (
          <img
            src={lawyer.cover_image_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : userProfile.banner_url ? (
          <img
            src={userProfile.banner_url}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand/30 to-brand/10" />
        )}
      </div>

      {/* Profile section */}
      <div className="px-4 relative z-[2]">
        {/* Avatar + action buttons row */}
        <div className="flex items-end justify-between -mt-[67px] mb-3">
          <div className="size-[134px] rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="size-full rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[48px]">
                {userProfile.full_name?.charAt(0)?.toUpperCase() || "L"}
              </div>
            )}
          </div>

          <div className="flex gap-2 pb-3">
            {isOwnProfile ? (
              <Link
                href="/dashboard/profile"
                className="h-9 px-4 rounded-full border border-border-custom text-[15px] font-bold text-text-primary hover:bg-[#E7E9EA] transition-colors inline-flex items-center"
              >
                Edit profile
              </Link>
            ) : (
              <>
                <Link
                  href={`/messages?to=${lawyer.user_id}`}
                  className="size-9 rounded-full border border-border-custom flex items-center justify-center hover:bg-[#E7E9EA] transition-colors"
                >
                  <MessageCircle className="size-5 text-text-primary" />
                </Link>
                <Link
                  href={`/consultations/book/${lawyer.user_id}`}
                  className="size-9 rounded-full border border-border-custom flex items-center justify-center hover:bg-[#E7E9EA] transition-colors"
                >
                  <Calendar className="size-5 text-text-primary" />
                </Link>
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={cn(
                    "h-9 px-4 rounded-full text-[15px] font-bold transition-colors inline-flex items-center",
                    isFollowing
                      ? "border border-border-custom text-text-primary hover:border-[#F4212E]/50 hover:text-[#F4212E] hover:bg-[#F4212E]/5"
                      : "bg-text-primary text-white hover:bg-text-primary/90"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name + verification */}
        <div className="flex items-center gap-1">
          <h2 className="text-xl font-extrabold text-text-primary">
            {userProfile.full_name}
          </h2>
          {userProfile.is_premium && <PremiumBadge size="sm" />}
          {lawyer.verification_status === "verified" && (
            <BadgeCheck className="size-5 text-brand" />
          )}
          <TierBadge tier={lawyer.subscription_tier} size="sm" />
        </div>

        {/* Handle / role */}
        <p className="text-[15px] text-muted-text">
          @{userProfile.handle || lawyer.slug} · Lawyer
        </p>

        {/* Bio */}
        {lawyer.bio && (
          <p className="mt-3 text-[15px] text-text-primary leading-5">
            {lawyer.bio}
          </p>
        )}

        {/* Meta info row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted-text">
          {lawyer.location_state && (
            <span className="flex items-center gap-1">
              <MapPin className="size-[18px]" />
              {lawyer.location_city
                ? `${lawyer.location_city}, ${lawyer.location_state}`
                : lawyer.location_state}
            </span>
          )}
          {lawyer.years_of_experience != null && (
            <span className="flex items-center gap-1">
              <Briefcase className="size-[18px]" />
              {lawyer.years_of_experience} years experience
            </span>
          )}
          {lawyer.availability_status === "accepting" && (
            <span className="flex items-center gap-1 text-[#00BA7C]">
              <Clock className="size-[18px]" />
              Accepting clients
            </span>
          )}
        </div>

        {/* Specializations */}
        {lawyer.specialization_ids.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(lawyer.specializations || []).map((spec) => (
              <span
                key={spec.id}
                className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[13px] font-medium text-brand"
              >
                {spec.name}
              </span>
            ))}
            {!lawyer.specializations &&
              lawyer.specialization_ids.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[13px] font-medium text-brand"
                >
                  {id}
                </span>
              ))}
          </div>
        )}

        {/* Link to social profile */}
        {userProfile.handle && (
          <div className="mt-2">
            <Link
              href={`/profile/${userProfile.handle}`}
              className="inline-flex items-center gap-1 text-[15px] text-brand hover:underline"
            >
              <LinkIcon className="size-4" />
              View social profile
            </Link>
          </div>
        )}

        {/* Following / Followers count */}
        <div className="mt-3 flex gap-4 text-[15px]">
          <span>
            <strong className="text-text-primary">{lawyer.follower_count}</strong>{" "}
            <span className="text-muted-text">Followers</span>
          </span>
          <span>
            <strong className="text-text-primary">{lawyer.post_count}</strong>{" "}
            <span className="text-muted-text">Posts</span>
          </span>
          {lawyer.rating_avg > 0 && (
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-brand text-brand" />
              <strong className="text-text-primary">{lawyer.rating_avg.toFixed(1)}</strong>
              <span className="text-muted-text">({lawyer.rating_count})</span>
            </span>
          )}
        </div>
      </div>

      {/* X-style tab navigation */}
      <div className="mt-4 flex border-b border-border-custom">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 flex items-center justify-center py-3.5 text-[15px] font-medium transition-colors hover:bg-black/[0.03] relative",
              activeTab === tab.value
                ? "font-bold text-text-primary"
                : "text-muted-text"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 text-muted-text">({tab.count})</span>
            )}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full bg-brand" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div>
          {posts.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <p className="text-[15px] text-muted-text">No posts yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/feed/${post.id}`}
                className="flex gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[15px]">
                    {userProfile.full_name?.charAt(0)?.toUpperCase() || "L"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] font-bold text-text-primary truncate">
                      {userProfile.full_name}
                    </span>
                    {userProfile.is_premium && <PremiumBadge size="sm" />}
                    {lawyer.verification_status === "verified" && (
                      <BadgeCheck className="size-[18px] text-brand shrink-0" />
                    )}
                    <span className="text-[15px] text-muted-text truncate">
                      @{userProfile.handle || lawyer.slug}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[15px] text-text-primary leading-5 line-clamp-3">
                    {post.content}
                  </p>
                  {post.category && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[12px] text-brand font-medium">
                      {post.category}
                    </span>
                  )}
                  <div className="mt-2 flex gap-6 text-[13px] text-muted-text">
                    <span>{post.comment_count || 0} replies</span>
                    <span>{post.like_count || 0} likes</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "about" && (
        <div className="p-4 space-y-4">
          {/* Education */}
          {lawyer.education && lawyer.education.length > 0 && (
            <div className="border-b border-border-custom pb-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary mb-3">
                <GraduationCap className="size-5 text-brand" />
                Education
              </h3>
              <div className="space-y-3 ml-7">
                {lawyer.education.map((edu, i) => (
                  <div key={i}>
                    <p className="text-[15px] font-medium text-text-primary">
                      {edu.institution}
                    </p>
                    <p className="text-[13px] text-muted-text">
                      {edu.degree} &middot; {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {lawyer.languages.length > 0 && (
            <div className="border-b border-border-custom pb-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary mb-3">
                <Globe className="size-5 text-brand" />
                Languages
              </h3>
              <div className="flex flex-wrap gap-2 ml-7">
                {lawyer.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full border border-border-custom px-3 py-1 text-[13px] text-text-primary"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fee Range */}
          {lawyer.fee_range_min != null && (
            <div className="border-b border-border-custom pb-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary mb-2">
                <Briefcase className="size-5 text-brand" />
                Fee Range
              </h3>
              <p className="text-[15px] text-text-primary ml-7">
                ₦{lawyer.fee_range_min.toLocaleString()} - ₦
                {(lawyer.fee_range_max ?? 0).toLocaleString()}
              </p>
            </div>
          )}

          {/* Credentials */}
          {lawyer.scn && (
            <div className="pb-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary mb-2">
                <BadgeCheck className="size-5 text-brand" />
                Credentials
              </h3>
              <div className="ml-7 text-[15px] text-text-primary">
                <p>SCN: {lawyer.scn}</p>
                {lawyer.nba_branch && (
                  <p className="text-muted-text mt-1">
                    NBA Branch: {lawyer.nba_branch}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div>
          {/* Rating summary */}
          {lawyer.rating_avg > 0 && (
            <div className="px-4 py-4 border-b border-border-custom">
              <div className="flex items-center gap-3">
                <span className="text-[31px] font-extrabold text-text-primary">
                  {lawyer.rating_avg.toFixed(1)}
                </span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`size-5 ${
                          i <= Math.round(lawyer.rating_avg)
                            ? "fill-brand text-brand"
                            : "text-[#EFF3F4]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] text-muted-text mt-0.5">
                    {lawyer.rating_count} review
                    {lawyer.rating_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <p className="text-[15px] text-muted-text">No reviews yet.</p>
            </div>
          ) : (
            reviews.map((review) => {
              const createdAt = review.created_at
                ? typeof review.created_at === "string"
                  ? new Date(review.created_at)
                  : review.created_at?.toDate?.() ?? new Date()
                : new Date();

              return (
                <div
                  key={review.id}
                  className="px-4 py-3 border-b border-border-custom"
                >
                  <div className="flex items-start gap-3">
                    {review.client?.avatar_url ? (
                      <img
                        src={review.client.avatar_url}
                        alt={review.client.full_name}
                        className="size-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-full bg-[#EFF3F4] flex items-center justify-center text-muted-text font-bold text-[15px]">
                        {review.client?.full_name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-bold text-text-primary">
                          {review.client?.full_name || "Client"}
                        </span>
                        <span className="text-[13px] text-muted-text">
                          {createdAt.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="mt-0.5 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i <= review.rating
                                ? "fill-brand text-brand"
                                : "text-[#EFF3F4]"
                            }`}
                          />
                        ))}
                      </div>
                      {review.content && (
                        <p className="mt-2 text-[15px] text-text-primary leading-5">
                          {review.content}
                        </p>
                      )}
                      {review.lawyer_response && (
                        <div className="mt-3 rounded-xl bg-[#F7F9F9] p-3">
                          <p className="text-[13px] font-bold text-text-primary mb-1">
                            Response
                          </p>
                          <p className="text-[13px] text-muted-text leading-4">
                            {review.lawyer_response}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
