"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  ArrowLeft,
  Trash2,
  Pin,
  Heart,
  MessageCircle,
  Eye,
  PenSquare,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import type { Post } from "@/types";

export const dynamic = "force-dynamic";

export default function DashboardPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchPosts() {
      try {
        const q = query(
          collection(db, "posts"),
          where("author_id", "==", user!.uid),
          orderBy("created_at", "desc"),
          firestoreLimit(50)
        );
        const snap = await getDocs(q);
        setPosts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
        );
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [user, authLoading]);

  async function handleDelete(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  async function togglePin(postId: string, currentPinned: boolean) {
    try {
      await updateDoc(doc(db, "posts", postId), {
        is_pinned: !currentPinned,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_pinned: !currentPinned } : p
        )
      );
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
          >
            <ArrowLeft className="size-5 text-text-primary" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary leading-tight">My Posts</h1>
            <p className="text-[13px] text-muted-text">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link
          href="/feed?compose=true"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          <PenSquare className="size-3.5" />
          Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <PenSquare className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[31px] font-extrabold text-text-primary">
            No posts yet
          </h2>
          <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
            Start sharing your legal expertise with the community.
          </p>
          <Link
            href="/feed?compose=true"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            Create your first post
          </Link>
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
              <div key={post.id} className="px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/feed/${post.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.is_pinned && (
                        <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-brand">
                          <Pin className="size-3" />
                          Pinned
                        </span>
                      )}
                      {post.category && post.category !== "general" && (
                        <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[11px] text-brand font-medium">
                          {post.category}
                        </span>
                      )}
                      <span className="text-[13px] text-muted-text">
                        {createdAt.toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-[15px] text-text-primary line-clamp-2 leading-5">
                      {post.content}
                    </p>
                    <div className="mt-2 flex gap-4 text-[13px] text-muted-text">
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
                  </Link>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => togglePin(post.id, post.is_pinned)}
                      className={`size-8 flex items-center justify-center rounded-full transition-colors hover:bg-brand/10 ${
                        post.is_pinned ? "text-brand" : "text-muted-text"
                      }`}
                      title={post.is_pinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="size-8 flex items-center justify-center rounded-full text-muted-text hover:text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
