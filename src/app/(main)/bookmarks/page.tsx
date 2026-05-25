"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Bookmark } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import type { Post, UserProfile, LawyerProfile } from "@/types";

export const dynamic = "force-dynamic";

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchBookmarks() {
      try {
        const bookmarksQuery = query(
          collection(db, "post_bookmarks"),
          where("user_id", "==", user!.uid)
        );
        const bookmarksSnap = await getDocs(bookmarksQuery);
        const postIds = bookmarksSnap.docs.map(
          (d) => d.data().post_id as string
        );

        if (postIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch posts
        const postsData: Post[] = [];
        await Promise.all(
          postIds.map(async (pid) => {
            const postDoc = await getDoc(doc(db, "posts", pid));
            if (postDoc.exists()) {
              postsData.push({
                id: postDoc.id,
                ...postDoc.data(),
              } as Post);
            }
          })
        );

        // Hydrate with authors
        const authorIds = [...new Set(postsData.map((p) => p.author_id))];
        const profileMap = new Map<string, UserProfile>();
        const lawyerMap = new Map<string, LawyerProfile>();

        await Promise.all(
          authorIds.map(async (uid) => {
            const [userDoc, lawyerDoc] = await Promise.all([
              getDoc(doc(db, "users", uid)),
              getDoc(doc(db, "lawyer_profiles", uid)),
            ]);
            if (userDoc.exists()) {
              profileMap.set(uid, {
                id: userDoc.id,
                ...userDoc.data(),
              } as UserProfile);
            }
            if (lawyerDoc.exists()) {
              lawyerMap.set(uid, {
                id: lawyerDoc.id,
                ...lawyerDoc.data(),
              } as LawyerProfile);
            }
          })
        );

        const hydrated = postsData.map((p) => ({
          ...p,
          author: profileMap.get(p.author_id),
          author_profile: lawyerMap.get(p.author_id),
          is_bookmarked: true,
        }));

        // Check likes
        const likeChecks = await Promise.all(
          hydrated.map((p) =>
            getDoc(doc(db, "post_likes", `${user!.uid}_${p.id}`))
          )
        );
        likeChecks.forEach((snap, i) => {
          if (snap.exists()) {
            hydrated[i].is_liked = true;
          }
        });

        setPosts(hydrated);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user, authLoading]);

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex flex-col justify-center">
        <h1 className="text-xl font-extrabold text-text-primary">Bookmarks</h1>
        <p className="text-[13px] text-muted-text leading-tight">
          @{user?.displayName?.toLowerCase().replace(/\s+/g, "") || "user"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-[31px] font-extrabold text-text-primary">
            Save posts for later
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            Bookmark posts to easily find them again in the future.
          </p>
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
