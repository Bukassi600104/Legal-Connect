"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  Trash2,
  BadgeCheck,
  Repeat2,
} from "lucide-react";
import { PollDisplay } from "@/components/feed/poll-display";
import { ThreadView } from "@/components/feed/thread-view";
import { PageLoader } from "@/components/shared/loading-spinner";
import { OptimizedMediaImage } from "@/components/shared/optimized-image";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import type { Post, PostComment, UserProfile, LawyerProfile } from "@/types";

export const dynamic = "force-dynamic";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user } = useAuth();

  const [post, setPost] = useState<
    (Post & { author?: UserProfile; author_profile?: LawyerProfile }) | null
  >(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const q = query(
        collection(db, "post_comments"),
        where("post_id", "==", postId),
        orderBy("created_at", "asc")
      );
      const snap = await getDocs(q);
      const rawComments = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PostComment)
      );

      const userIds = [...new Set(rawComments.map((c) => c.user_id))];
      const userMap = new Map<string, UserProfile>();
      await Promise.all(
        userIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            userMap.set(uid, {
              id: userDoc.id,
              ...userDoc.data(),
            } as UserProfile);
          }
        })
      );

      const hydrated = rawComments.map((c) => ({
        ...c,
        user: userMap.get(c.user_id),
      }));

      setComments(hydrated);
    } catch {
      // Index may not exist
    }
  }, [postId]);

  const fetchPost = useCallback(async () => {
    try {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (!postDoc.exists()) {
        setLoading(false);
        return;
      }

      const postData = { id: postDoc.id, ...postDoc.data() } as Post;

      const authorDoc = await getDoc(doc(db, "users", postData.author_id));
      let author: UserProfile | undefined;
      if (authorDoc.exists()) {
        author = { id: authorDoc.id, ...authorDoc.data() } as UserProfile;
      }

      let authorProfile: LawyerProfile | undefined;
      const lawyerDoc = await getDoc(
        doc(db, "lawyer_profiles", postData.author_id)
      );
      if (lawyerDoc.exists()) {
        authorProfile = {
          id: lawyerDoc.id,
          ...lawyerDoc.data(),
        } as LawyerProfile;
      }

      setPost({ ...postData, author, author_profile: authorProfile });
      setLikeCount(postData.like_count);

      if (user) {
        const [likeDoc, bookmarkDoc] = await Promise.all([
          getDoc(doc(db, "post_likes", `${user.uid}_${postId}`)),
          getDoc(doc(db, "post_bookmarks", `${user.uid}_${postId}`)),
        ]);
        setLiked(likeDoc.exists());
        setBookmarked(bookmarkDoc.exists());
      }

      await fetchComments();
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchComments, postId, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPost();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPost]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;

    setSubmitting(true);
    const text = commentText.trim();
    setCommentText("");

    try {
      const response = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: text }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Comment creation failed");
      }

      await fetchComments();
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comment_count:
                typeof data.comment_count === "number"
                  ? data.comment_count
                  : prev.comment_count + 1,
            }
          : prev
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentText(text);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const response = await fetch("/api/posts/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Comment deletion failed");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comment_count:
                typeof data.comment_count === "number"
                  ? data.comment_count
                  : Math.max(0, prev.comment_count - 1),
            }
          : prev
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }

  async function handleLike() {
    if (!user) return;

    try {
      const response = await fetch("/api/posts/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, interaction: "like" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Post interaction failed");
      }

      setLiked(Boolean(data.active));
      if (typeof data.like_count === "number") {
        setLikeCount(data.like_count);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }

  async function handleBookmark() {
    if (!user) return;

    try {
      const response = await fetch("/api/posts/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, interaction: "bookmark" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Post interaction failed");
      }

      setBookmarked(Boolean(data.active));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  }

  if (loading) return <PageLoader />;

  if (!post) {
    return (
      <div className="px-8 py-16 text-center">
        <MessageCircle className="size-10 text-muted-text mx-auto mb-3" />
        <h2 className="text-[31px] font-extrabold text-text-primary">
          Post not found
        </h2>
        <p className="mt-2 text-[15px] text-muted-text">
          This post may have been deleted.
        </p>
        <Link
          href="/feed"
          className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  const createdAt = post.created_at
    ? typeof post.created_at === "string"
      ? new Date(post.created_at)
      : post.created_at?.toDate?.() ?? new Date()
    : new Date();

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-text-primary">Post</h1>
      </div>

      {/* Main post */}
      <article className="px-4 pt-3 pb-0 border-b border-border-custom">
        {/* Author row */}
        <div className="flex items-start gap-3">
          <Link
            href={
              post.author_profile?.slug
                ? `/lawyer/${post.author_profile.slug}`
                : "#"
            }
          >
            <div className="size-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[15px]">
              {post.author?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          </Link>
          <div className="flex-1">
            <Link
              href={
                post.author_profile?.slug
                  ? `/lawyer/${post.author_profile.slug}`
                  : "#"
              }
              className="flex items-center gap-1"
            >
              <span className="text-[15px] font-bold text-text-primary hover:underline">
                {post.author?.full_name || "Unknown"}
              </span>
              {post.author_profile?.verification_status === "verified" && (
                <BadgeCheck className="size-[18px] text-brand" />
              )}
            </Link>
            <p className="text-[13px] text-muted-text">
              @{post.author_profile?.slug || "user"}
            </p>
          </div>
        </div>

        {/* Post content */}
        <div className="mt-3">
          <p className="text-[17px] leading-6 text-text-primary whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-border-custom">
            {post.media_urls.map((url, i) => (
              <OptimizedMediaImage
                key={i}
                src={url}
                alt={`Media ${i + 1}`}
                className="max-h-[500px]"
              />
            ))}
          </div>
        )}

        {/* Poll */}
        {post.poll && <PollDisplay postId={post.id} poll={post.poll} />}

        {/* Thread view */}
        {post.thread_id && <ThreadView threadId={post.thread_id} />}

        {/* Category tag */}
        {post.category && post.category !== "general" && (
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-[13px] text-brand font-medium">
              {post.category}
            </span>
          </div>
        )}

        {/* Time and date */}
        <div className="mt-3 py-3 border-t border-border-custom text-[15px] text-muted-text">
          <span>{format(createdAt, "h:mm a")}</span>
          <span className="mx-1">·</span>
          <span>{format(createdAt, "MMM d, yyyy")}</span>
          {post.view_count > 0 && (
            <>
              <span className="mx-1">·</span>
              <span>
                <strong className="text-text-primary">{post.view_count.toLocaleString()}</strong> Views
              </span>
            </>
          )}
        </div>

        {/* Engagement stats */}
        <div className="py-3 border-t border-border-custom flex gap-5 text-[15px]">
          {post.share_count > 0 && (
            <span>
              <strong className="text-text-primary">{post.share_count}</strong>{" "}
              <span className="text-muted-text">Reposts</span>
            </span>
          )}
          <span>
            <strong className="text-text-primary">{likeCount}</strong>{" "}
            <span className="text-muted-text">Likes</span>
          </span>
          {"bookmark_count" in post && (post as unknown as { bookmark_count: number }).bookmark_count > 0 && (
            <span>
              <strong className="text-text-primary">{(post as unknown as { bookmark_count: number }).bookmark_count}</strong>{" "}
              <span className="text-muted-text">Bookmarks</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="py-1 border-t border-border-custom flex items-center justify-around">
          <button
            onClick={() => textareaRef.current?.focus()}
            className="size-[34px] flex items-center justify-center rounded-full text-muted-text hover:text-brand hover:bg-brand/10 transition-colors"
          >
            <MessageCircle className="size-5" />
          </button>
          <button className="size-[34px] flex items-center justify-center rounded-full text-muted-text hover:text-[#00BA7C] hover:bg-[#00BA7C]/10 transition-colors">
            <Repeat2 className="size-5" />
          </button>
          <button
            onClick={handleLike}
            className={cn(
              "size-[34px] flex items-center justify-center rounded-full transition-colors",
              liked
                ? "text-[#F91880]"
                : "text-muted-text hover:text-[#F91880] hover:bg-[#F91880]/10"
            )}
          >
            <Heart className={cn("size-5", liked && "fill-[#F91880]")} />
          </button>
          <button
            onClick={handleBookmark}
            className={cn(
              "size-[34px] flex items-center justify-center rounded-full transition-colors",
              bookmarked
                ? "text-brand"
                : "text-muted-text hover:text-brand hover:bg-brand/10"
            )}
          >
            <Bookmark className={cn("size-5", bookmarked && "fill-brand")} />
          </button>
          <button className="size-[34px] flex items-center justify-center rounded-full text-muted-text hover:text-brand hover:bg-brand/10 transition-colors">
            <Share2 className="size-5" />
          </button>
        </div>
      </article>

      {/* Reply composer */}
      {user && (
        <form
          onSubmit={handleComment}
          className="flex items-start gap-3 px-4 py-3 border-b border-border-custom"
        >
          <div className="size-8 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[13px] mt-1">
            {user.displayName?.charAt(0)?.toUpperCase() || "Y"}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post your reply"
              rows={2}
              className="w-full resize-none border-0 bg-transparent text-[15px] text-text-primary placeholder:text-muted-text outline-none min-h-[52px]"
            />
          </div>
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="shrink-0 mt-1 h-8 px-4 rounded-full bg-brand text-[14px] font-bold text-white disabled:opacity-50 hover:bg-brand-dark transition-colors"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Reply"
            )}
          </button>
        </form>
      )}

      {/* Comments / Replies */}
      <div>
        {comments.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-[15px] text-muted-text">
              No replies yet. Be the first to reply!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const commentDate = comment.created_at
              ? typeof comment.created_at === "string"
                ? new Date(comment.created_at)
                : comment.created_at?.toDate?.() ?? new Date()
              : new Date();

            const isOwn = comment.user_id === user?.uid;

            return (
              <div
                key={comment.id}
                className="flex gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                <div className="size-10 shrink-0 rounded-full bg-[#EFF3F4] flex items-center justify-center text-muted-text font-bold text-[15px]">
                  {comment.user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] font-bold text-text-primary">
                      {comment.user?.full_name || "User"}
                    </span>
                    <span className="text-[15px] text-muted-text">·</span>
                    <span className="text-[13px] text-muted-text">
                      {formatDistanceToNow(commentDate, { addSuffix: true })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-auto text-muted-text hover:text-[#F4212E] p-1 rounded-full hover:bg-[#F4212E]/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[15px] text-text-primary leading-5 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
