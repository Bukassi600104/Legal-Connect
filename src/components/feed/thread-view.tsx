"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";
import type { Post, UserProfile, LawyerProfile } from "@/types";

interface ThreadViewProps {
  threadId: string;
}

type PopulatedPost = Post & {
  author?: UserProfile;
  author_profile?: LawyerProfile;
};

export function ThreadView({ threadId }: ThreadViewProps) {
  const [posts, setPosts] = useState<PopulatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThread() {
      try {
        const q = query(
          collection(db, "posts"),
          where("thread_id", "==", threadId),
          orderBy("thread_position", "asc")
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
        console.error("Error fetching thread:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchThread();
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 text-brand animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="border-b border-border-custom">
      <div className="px-4 py-2">
        <span className="text-[13px] font-bold text-muted-text uppercase tracking-wide">
          Thread
        </span>
      </div>
      {posts.map((post, index) => (
        <div key={post.id} className="relative">
          {/* Connector line between thread posts */}
          {index < posts.length - 1 && (
            <div className="absolute left-[35px] top-[52px] bottom-0 w-0.5 bg-border-custom" />
          )}
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
