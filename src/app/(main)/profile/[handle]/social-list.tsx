"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  UserRound,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";
import type { LawyerProfile, UserProfile } from "@/types";

type ListMode = "followers" | "following";

type SocialUser = UserProfile & {
  lawyerProfile?: LawyerProfile;
};

async function hydrateUser(userId: string): Promise<SocialUser | null> {
  const [userDoc, lawyerDoc] = await Promise.all([
    getDoc(doc(db, "users", userId)),
    getDoc(doc(db, "lawyer_profiles", userId)),
  ]);

  if (!userDoc.exists()) return null;

  const user = { id: userDoc.id, ...userDoc.data() } as SocialUser;
  if (lawyerDoc.exists()) {
    user.lawyerProfile = {
      id: lawyerDoc.id,
      ...lawyerDoc.data(),
    } as LawyerProfile;
  }

  return user;
}

export function ProfileSocialList({ mode }: { mode: ListMode }) {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      setLoading(true);
      try {
        const handleDoc = await getDoc(doc(db, "handles", handle));
        if (!handleDoc.exists()) {
          setLoading(false);
          return;
        }

        const userId = handleDoc.data().user_id;
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        setProfileUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);

        const followsQuery = query(
          collection(db, "follows"),
          where(mode === "followers" ? "following_id" : "follower_id", "==", userId),
          orderBy("created_at", "desc")
        );
        const followsSnap = await getDocs(followsQuery);
        const ids = followsSnap.docs
          .map((followDoc) => followDoc.data()[mode === "followers" ? "follower_id" : "following_id"])
          .filter((id): id is string => typeof id === "string");

        const hydrated = await Promise.all(ids.map((id) => hydrateUser(id)));
        setUsers(hydrated.filter((user): user is SocialUser => !!user));
      } catch (error) {
        console.error("Error fetching social list:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchList();
  }, [handle, mode]);

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <div>
      <div className="sticky top-0 z-10 flex h-[53px] items-center gap-4 border-b border-border-custom bg-white/85 px-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[#E7E9EA]"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-text-primary">
            {title}
          </h1>
          <p className="truncate text-[13px] text-muted-text">
            {profileUser ? `@${profileUser.handle}` : `@${handle}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : users.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <UserRound className="mx-auto size-8 text-muted-text" />
          <p className="mt-3 text-[15px] text-muted-text">
            No {title.toLowerCase()} yet.
          </p>
        </div>
      ) : (
        <div>
          {users.map((user) => {
            const isSubscribedLawyer =
              user.role === "lawyer" &&
              isPaidSubscriptionTier(user.lawyerProfile?.subscription_tier);
            const href =
              user.role === "lawyer" && user.lawyerProfile?.slug
                ? `/lawyer/${user.lawyerProfile.slug}`
                : `/profile/${user.handle}`;

            return (
              <Link
                key={user.id}
                href={href}
                className="flex gap-3 border-b border-border-custom px-4 py-3 transition-colors hover:bg-black/[0.03]"
              >
                {user.avatar_url ? (
                  <OptimizedAvatar
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="size-11"
                  />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                    {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[15px] font-bold text-text-primary">
                      {user.full_name}
                    </p>
                    {isSubscribedLawyer && <PremiumBadge size="sm" />}
                    {user.lawyerProfile?.verification_status === "verified" && (
                      <BadgeCheck className="size-4 shrink-0 text-brand" />
                    )}
                  </div>
                  <p className="truncate text-[13px] text-muted-text">
                    @{user.handle}
                  </p>
                  {(user.bio || user.lawyerProfile?.bio) && (
                    <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-text-primary">
                      {user.bio || user.lawyerProfile?.bio}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
