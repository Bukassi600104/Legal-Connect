"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PostCard } from "@/components/feed/post-card";
import type { Post, UserProfile, LawyerProfile } from "@/types";

export const dynamic = "force-dynamic";

type PopulatedPost = Post & {
  author?: UserProfile;
  author_profile?: LawyerProfile;
};

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = (params.tag as string).toLowerCase();

  const [posts, setPosts] = useState<PopulatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Get count from hashtag_counts
        const tagDoc = await getDoc(doc(db, "hashtag_counts", tag));
        if (tagDoc.exists()) {
          setPostCount(tagDoc.data().count || 0);
        }

        // Fetch posts with this hashtag
        const q = query(
          collection(db, "posts"),
          where("hashtags", "array-contains", tag),
          orderBy("created_at", "desc")
        );
        const snapshot = await getDocs(q);

        const results: PopulatedPost[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const post: PopulatedPost = {
            id: docSnap.id,
            ...data,
          } as PopulatedPost;

          // Fetch author
          try {
            const userDoc = await getDoc(doc(db, "users", data.author_id));
            if (userDoc.exists()) {
              post.author = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            }
          } catch {}

          // Fetch lawyer profile if exists
          try {
            const lpDoc = await getDoc(doc(db, "lawyer_profiles", data.author_id));
            if (lpDoc.exists()) {
              post.author_profile = { id: lpDoc.id, ...lpDoc.data() } as LawyerProfile;
            }
          } catch {}

          results.push(post);
        }

        setPosts(results);
      } catch (error) {
        console.error("Error fetching hashtag posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [tag]);

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
          <h1 className="text-xl font-extrabold text-text-primary leading-tight">
            #{tag}
          </h1>
          <p className="text-[13px] text-muted-text leading-tight">
            {postCount.toLocaleString()} posts
          </p>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 text-brand animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px] text-muted-text">
            No posts found with #{tag}
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
