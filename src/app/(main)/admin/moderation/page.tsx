"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Flag,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Post, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

interface ReportedPost extends Post {
  author?: UserProfile;
}

export default function ModerationPage() {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ReportedPost | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchReportedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "posts"),
        orderBy("created_at", "desc"),
        firestoreLimit(50)
      );

      const snap = await getDocs(q);
      const allPosts = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Post)
      );

      const hydrated: ReportedPost[] = await Promise.all(
        allPosts.map(async (post) => {
          let author: UserProfile | undefined;
          try {
            const userDoc = await getDoc(doc(db, "users", post.author_id));
            if (userDoc.exists()) {
              author = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            }
          } catch {}
          return { ...post, author };
        })
      );

      setPosts(hydrated);
    } catch (error) {
      console.error("Error fetching posts for moderation:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReportedPosts();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchReportedPosts]);

  async function handleRemovePost(postId: string) {
    if (processing) return;
    setProcessing(true);

    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error("Error removing post:", error);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="px-4 py-3 border-b border-border-custom">
        <p className="text-[13px] text-muted-text">
          {posts.length} posts loaded for review.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <Flag className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            All clear
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            No content to review right now.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => {
            const createdAt = post.created_at
              ? typeof post.created_at === "string"
                ? new Date(post.created_at)
                : post.created_at?.toDate?.() ?? new Date()
              : new Date();

            return (
              <div
                key={post.id}
                className="px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[15px]">
                    {post.author?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-text-primary">
                        {post.author?.full_name || "Unknown"}
                      </span>
                      {post.category && post.category !== "general" && (
                        <span className="text-[11px] font-medium rounded-full bg-brand/10 text-brand px-2 py-0.5">
                          {post.category}
                        </span>
                      )}
                      <span className="text-[13px] text-muted-text ml-auto">
                        {createdAt.toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-[15px] text-text-primary line-clamp-3 leading-5">
                      {post.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-4 text-[13px] text-muted-text">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="size-3.5" />
                          {post.like_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="size-3.5" />
                          {post.comment_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" />
                          {post.view_count}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="size-8 flex items-center justify-center rounded-full text-muted-text hover:text-brand hover:bg-brand/10 transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleRemovePost(post.id)}
                          className="size-8 flex items-center justify-center rounded-full text-muted-text hover:text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post detail dialog */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              By {selectedPost?.author?.full_name || "Unknown Author"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-[15px] text-text-primary whitespace-pre-wrap">
              {selectedPost?.content}
            </p>

            {selectedPost?.media_urls && selectedPost.media_urls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {selectedPost.media_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Media ${i + 1}`}
                    className="h-32 w-auto rounded-2xl object-cover"
                  />
                ))}
              </div>
            )}

            <div className="flex gap-4 text-[13px] text-muted-text pt-2 border-t border-border-custom">
              <span>{selectedPost?.like_count} likes</span>
              <span>{selectedPost?.comment_count} comments</span>
              <span>{selectedPost?.share_count} shares</span>
              <span>{selectedPost?.view_count} views</span>
            </div>
          </div>

          <DialogFooter>
            <button
              disabled={processing}
              onClick={() =>
                selectedPost && handleRemovePost(selectedPost.id)
              }
              className="h-9 px-4 rounded-full bg-[#F4212E] text-[14px] font-bold text-white hover:bg-[#F4212E]/90 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="size-4 inline mr-1" />
              Remove Post
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
