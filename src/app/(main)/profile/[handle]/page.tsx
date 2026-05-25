"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  MapPin,
  MessageCircle,
  LinkIcon,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PostCard } from "@/components/feed/post-card";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Post, UserProfile, LawyerProfile } from "@/types";

export const dynamic = "force-dynamic";

type Tab = "posts" | "threads" | "replies" | "likes";

type PopulatedPost = Post & {
  author?: UserProfile;
  author_profile?: LawyerProfile;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<PopulatedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        // Lookup handle -> user_id
        const handleDoc = await getDoc(doc(db, "handles", handle));
        if (!handleDoc.exists()) {
          setLoading(false);
          return;
        }

        const userId = handleDoc.data().user_id;

        // Fetch user
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        setProfileUser(userData);
        setFollowerCount(userData.follower_count || 0);

        // Fetch lawyer profile if exists
        try {
          const lpDoc = await getDoc(doc(db, "lawyer_profiles", userId));
          if (lpDoc.exists()) {
            setLawyerProfile({ id: lpDoc.id, ...lpDoc.data() } as LawyerProfile);
          }
        } catch {}

        // Check if current user follows
        if (currentUser && currentUser.uid !== userId) {
          const followId = `${currentUser.uid}_${userId}`;
          const followDoc = await getDoc(doc(db, "follows", followId));
          setIsFollowing(followDoc.exists());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [handle, currentUser]);

  // Fetch posts for active tab
  useEffect(() => {
    if (!profileUser) return;

    async function fetchPosts() {
      setPostsLoading(true);
      try {
        let q;

        if (activeTab === "posts") {
          q = query(
            collection(db, "posts"),
            where("author_id", "==", profileUser!.id),
            orderBy("created_at", "desc")
          );
        } else if (activeTab === "threads") {
          q = query(
            collection(db, "posts"),
            where("author_id", "==", profileUser!.id),
            where("is_thread_starter", "==", true),
            orderBy("created_at", "desc")
          );
        } else {
          // For replies and likes, just show posts for now
          q = query(
            collection(db, "posts"),
            where("author_id", "==", profileUser!.id),
            orderBy("created_at", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const results: PopulatedPost[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          author: profileUser,
          author_profile: lawyerProfile || undefined,
        })) as PopulatedPost[];

        setPosts(results);
      } catch (error) {
        console.error("Error fetching profile posts:", error);
      } finally {
        setPostsLoading(false);
      }
    }

    fetchPosts();
  }, [profileUser, lawyerProfile, activeTab]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser || currentUser.uid === profileUser.id) return;

    const followId = `${currentUser.uid}_${profileUser.id}`;
    const followRef = doc(db, "follows", followId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        await updateDoc(doc(db, "users", profileUser.id), {
          follower_count: increment(-1),
        });
      } else {
        await setDoc(followRef, {
          follower_id: currentUser.uid,
          following_id: profileUser.id,
          created_at: serverTimestamp(),
        });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        await updateDoc(doc(db, "users", profileUser.id), {
          follower_count: increment(1),
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 text-brand animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-extrabold text-text-primary">Account not found</h2>
        <p className="mt-2 text-[15px] text-muted-text">@{handle} doesn't exist</p>
      </div>
    );
  }

  const createdAt = profileUser.created_at
    ? typeof profileUser.created_at === "string"
      ? new Date(profileUser.created_at)
      : (profileUser.created_at as any).toDate?.() ?? new Date()
    : new Date();

  const isOwnProfile = currentUser?.uid === profileUser.id;

  const tabs: { label: string; value: Tab }[] = [
    { label: "Posts", value: "posts" },
    { label: "Threads", value: "threads" },
    { label: "Replies", value: "replies" },
    { label: "Likes", value: "likes" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center size-8 rounded-full hover:bg-[#E7E9EA] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </button>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-extrabold text-text-primary leading-tight">
              {profileUser.full_name}
            </h1>
            {profileUser.is_premium && <PremiumBadge size="sm" />}
            {lawyerProfile && (
              <VerificationBadge status={lawyerProfile.verification_status} size="sm" />
            )}
          </div>
          <p className="text-[13px] text-muted-text leading-tight">
            {profileUser.post_count || 0} posts
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-[200px] bg-brand/20 relative z-[1]">
        {profileUser.banner_url && (
          <img
            src={profileUser.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Avatar + Actions */}
      <div className="px-4 relative z-[2]">
        <div className="-mt-[67px] mb-3 flex items-end justify-between">
          {/* Avatar */}
          <div className="size-[134px] rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
            {profileUser.avatar_url ? (
              <img
                src={profileUser.avatar_url}
                alt={profileUser.full_name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="size-full rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-4xl">
                {profileUser.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-3">
            {!isOwnProfile && currentUser && (
              <>
                <Link
                  href={`/messages?to=${profileUser.id}`}
                  className="inline-flex items-center justify-center size-9 rounded-full border border-border-custom text-text-primary hover:bg-[#E7E9EA] transition-colors"
                >
                  <MessageCircle className="size-4" />
                </Link>
                <button
                  onClick={handleFollow}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-4 text-[15px] font-bold transition-colors",
                    isFollowing
                      ? "border border-border-custom text-text-primary hover:border-[#F4212E] hover:text-[#F4212E] hover:bg-[#F4212E]/5"
                      : "bg-text-primary text-white hover:bg-text-primary/90"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </>
            )}
            {isOwnProfile && (
              <Link
                href="/settings"
                className="inline-flex h-9 items-center rounded-full border border-border-custom px-4 text-[15px] font-bold text-text-primary hover:bg-[#E7E9EA] transition-colors"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Name + Handle */}
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-extrabold text-text-primary">
              {profileUser.full_name}
            </h2>
            {profileUser.is_premium && <PremiumBadge />}
            {lawyerProfile && (
              <VerificationBadge status={lawyerProfile.verification_status} size="sm" />
            )}
          </div>
          <p className="text-[15px] text-muted-text">@{profileUser.handle}</p>
        </div>

        {/* Bio */}
        {(profileUser.bio || lawyerProfile?.bio) && (
          <p className="text-[15px] text-text-primary leading-[20px] mb-3 whitespace-pre-wrap">
            {profileUser.bio || lawyerProfile?.bio}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-muted-text mb-3">
          {lawyerProfile?.location_state && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {lawyerProfile.location_city ? `${lawyerProfile.location_city}, ` : ""}
              {lawyerProfile.location_state}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-4" />
            Joined {format(createdAt, "MMMM yyyy")}
          </span>
          {profileUser.role === "lawyer" && lawyerProfile?.slug && (
            <Link
              href={`/lawyer/${lawyerProfile.slug}`}
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              <LinkIcon className="size-4" />
              View lawyer profile
            </Link>
          )}
        </div>

        {/* Following / Followers */}
        <div className="flex items-center gap-4 text-[15px] mb-1">
          <span>
            <strong className="text-text-primary">{profileUser.following_count || 0}</strong>{" "}
            <span className="text-muted-text">Following</span>
          </span>
          <span>
            <strong className="text-text-primary">{followerCount}</strong>{" "}
            <span className="text-muted-text">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-custom mt-3">
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

      {/* Posts list */}
      {postsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 text-brand animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px] text-muted-text">
            {activeTab === "posts" && "No posts yet"}
            {activeTab === "threads" && "No threads yet"}
            {activeTab === "replies" && "No replies yet"}
            {activeTab === "likes" && "No likes yet"}
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
