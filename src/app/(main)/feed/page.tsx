"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ComposeBox } from "@/components/feed/compose-box";
import { PostCard } from "@/components/feed/post-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post, UserProfile, LawyerProfile } from "@/types";

export const dynamic = "force-dynamic";

type FeedTab = "for-you" | "following";

export default function FeedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let postsQuery;

      if (activeTab === "following" && user) {
        const followsQuery = query(
          collection(db, "follows"),
          where("follower_id", "==", user.uid)
        );
        const followsSnap = await getDocs(followsQuery);
        const followingIds = followsSnap.docs.map(
          (d) => d.data().following_id as string
        );

        if (followingIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const chunks = [];
        for (let i = 0; i < followingIds.length; i += 30) {
          chunks.push(followingIds.slice(i, i + 30));
        }

        const allPosts: Post[] = [];
        for (const chunk of chunks) {
          const q = query(
            collection(db, "posts"),
            where("author_id", "in", chunk),
            orderBy("created_at", "desc"),
            firestoreLimit(50)
          );
          const snap = await getDocs(q);
          allPosts.push(
            ...snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
          );
        }

        allPosts.sort((a, b) => {
          const aTime =
            typeof a.created_at === "string"
              ? new Date(a.created_at).getTime()
              : a.created_at?.toDate?.()?.getTime() ?? 0;
          const bTime =
            typeof b.created_at === "string"
              ? new Date(b.created_at).getTime()
              : b.created_at?.toDate?.()?.getTime() ?? 0;
          return bTime - aTime;
        });

        const hydrated = await hydratePostAuthors(allPosts.slice(0, 50));
        setPosts(hydrated);
      } else {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("created_at", "desc"),
          firestoreLimit(50)
        );
        const snap = await getDocs(postsQuery);
        const rawPosts = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Post)
        );

        const hydrated = await hydratePostAuthors(rawPosts);
        setPosts(hydrated);
      }

      if (user) {
        setPosts((prev) =>
          prev.map((p) => ({ ...p }))
        );
        const postIds = posts.map((p) => p.id);
        if (postIds.length > 0) {
          await checkUserEngagement(user.uid, postIds, setPosts);
        }
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPosts();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPosts]);

  return (
    <div className="min-h-screen">
      {/* X-style sticky header with tabs */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-border-custom">
        <div className="flex items-center px-4 h-[53px] lg:hidden">
          {/* Mobile: title shown in header */}
        </div>
        <div className="hidden lg:flex items-center px-4 h-[53px]">
          <h1 className="text-xl font-extrabold text-text-primary">Home</h1>
        </div>
        <div className="flex">
          <button
            onClick={() => setActiveTab("for-you")}
            className={cn(
              "flex-1 flex items-center justify-center py-3 text-[15px] font-medium transition-colors hover:bg-black/[0.03] relative",
              activeTab === "for-you"
                ? "font-bold text-text-primary"
                : "text-muted-text"
            )}
          >
            For you
            {activeTab === "for-you" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full bg-brand" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={cn(
              "flex-1 flex items-center justify-center py-3 text-[15px] font-medium transition-colors hover:bg-black/[0.03] relative",
              activeTab === "following"
                ? "font-bold text-text-primary"
                : "text-muted-text"
            )}
          >
            Following
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-[72px] rounded-full bg-brand" />
            )}
          </button>
        </div>
      </div>

      {/* Compose box (lawyers only) */}
      <ComposeBox onPostCreated={fetchPosts} />

      {/* Posts */}
      {loading ? (
        <PageLoader />
      ) : posts.length === 0 ? (
        <div className="py-12 px-8">
          <EmptyState
            icon={PenSquare}
            title={
              activeTab === "following"
                ? "No Posts from People You Follow"
                : "No Posts Yet"
            }
            description={
              activeTab === "following"
                ? "Follow lawyers to see their posts here."
                : "Be the first to share a legal insight!"
            }
          />
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ HELPERS ============

async function hydratePostAuthors(posts: Post[]): Promise<Post[]> {
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const profileMap = new Map<string, UserProfile>();
  const lawyerProfileMap = new Map<string, LawyerProfile>();

  await Promise.all(
    authorIds.map(async (uid) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        profileMap.set(uid, { id: userDoc.id, ...userDoc.data() } as UserProfile);
      }
      const lawyerDoc = await getDoc(doc(db, "lawyer_profiles", uid));
      if (lawyerDoc.exists()) {
        lawyerProfileMap.set(uid, {
          id: lawyerDoc.id,
          ...lawyerDoc.data(),
        } as LawyerProfile);
      }
    })
  );

  return posts.map((post) => ({
    ...post,
    author: profileMap.get(post.author_id),
    author_profile: lawyerProfileMap.get(post.author_id),
  }));
}

async function checkUserEngagement(
  userId: string,
  postIds: string[],
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
) {
  try {
    const likeChecks = postIds.map((pid) =>
      getDoc(doc(db, "post_likes", `${userId}_${pid}`))
    );
    const bookmarkChecks = postIds.map((pid) =>
      getDoc(doc(db, "post_bookmarks", `${userId}_${pid}`))
    );

    const [likes, bookmarks] = await Promise.all([
      Promise.all(likeChecks),
      Promise.all(bookmarkChecks),
    ]);

    const likedSet = new Set<string>();
    const bookmarkedSet = new Set<string>();

    likes.forEach((snap, i) => {
      if (snap.exists()) likedSet.add(postIds[i]);
    });
    bookmarks.forEach((snap, i) => {
      if (snap.exists()) bookmarkedSet.add(postIds[i]);
    });

    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        is_liked: likedSet.has(p.id),
        is_bookmarked: bookmarkedSet.has(p.id),
      }))
    );
  } catch (error) {
    console.error("Error checking engagement:", error);
  }
}
