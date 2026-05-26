"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { CategoryPill } from "@/components/shared/category-pill";
import { PollDisplay } from "@/components/feed/poll-display";
import { useAuth } from "@/components/providers/auth-provider";
import {
  OptimizedAvatar,
  OptimizedMediaImage,
} from "@/components/shared/optimized-image";
import { cn } from "@/lib/utils";
import type { Post, UserProfile, LawyerProfile } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post & {
    author?: UserProfile;
    author_profile?: LawyerProfile;
  };
}

function renderContentWithHashtags(content: string) {
  const parts = content.split(/(#[a-zA-Z][a-zA-Z0-9_]{1,30})/g);
  return parts.map((part, i) => {
    if (part.startsWith("#") && /^#[a-zA-Z][a-zA-Z0-9_]{1,30}$/.test(part)) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link
          key={i}
          href={`/hashtag/${tag}`}
          className="text-brand hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked ?? false);
  const [actionLoading, setActionLoading] = useState(false);

  const createdAt = post.created_at
    ? typeof post.created_at === "string"
      ? new Date(post.created_at)
      : post.created_at.toDate?.() ?? new Date()
    : new Date();

  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: false });

  // Author profile link
  const authorHref = post.author?.handle
    ? `/profile/${post.author.handle}`
    : post.author_profile?.slug
      ? `/lawyer/${post.author_profile.slug}`
      : "#";

  const handleLike = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    const likeId = `${user.uid}_${post.id}`;
    const likeRef = doc(db, "post_likes", likeId);
    const postRef = doc(db, "posts", post.id);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { like_count: increment(-1) });
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await setDoc(likeRef, {
          post_id: post.id,
          user_id: user.uid,
          created_at: serverTimestamp(),
        });
        await updateDoc(postRef, { like_count: increment(1) });
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    const bookmarkId = `${user.uid}_${post.id}`;
    const bookmarkRef = doc(db, "post_bookmarks", bookmarkId);

    try {
      if (bookmarked) {
        await deleteDoc(bookmarkRef);
        setBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          post_id: post.id,
          user_id: user.uid,
          created_at: serverTimestamp(),
        });
        setBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <article className="border-b border-border-custom px-4 py-3 transition-colors hover:bg-black/[0.03] cursor-pointer">
      <div className="flex gap-3">
        {/* Author avatar */}
        <Link href={authorHref} className="shrink-0">
          {post.author?.avatar_url ? (
            <OptimizedAvatar
              src={post.author.avatar_url}
              alt={post.author.full_name || "User"}
              className="size-10"
            />
          ) : (
            <div className="size-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
              {post.author?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Author info row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <Link
                href={authorHref}
                className="text-[15px] font-bold text-text-primary hover:underline truncate"
              >
                {post.author?.full_name || "Unknown"}
              </Link>
              {post.author?.is_premium && <PremiumBadge size="sm" />}
              {post.author_profile && (
                <VerificationBadge
                  status={post.author_profile.verification_status}
                  size="sm"
                />
              )}
              {post.author?.handle && (
                <span className="text-[15px] text-muted-text shrink-0 hidden sm:inline">
                  @{post.author.handle}
                </span>
              )}
              <span className="text-[15px] text-muted-text shrink-0">
                &middot; {timeAgo}
              </span>
            </div>
            <button className="inline-flex items-center justify-center size-8 rounded-full text-muted-text hover:text-brand hover:bg-brand/10 transition-colors -mr-2">
              <MoreHorizontal className="size-[18px]" />
            </button>
          </div>

          {/* Thread indicator */}
          {post.is_thread_starter && (
            <Link
              href={`/feed/${post.id}`}
              className="text-[13px] text-brand hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Show this thread
            </Link>
          )}

          {/* Category pill */}
          {post.category && post.category !== "general" && (
            <div className="mt-0.5">
              <CategoryPill category={post.category} size="sm" />
            </div>
          )}

          {/* Content with clickable hashtags */}
          <div
            role="link"
            tabIndex={0}
            onClick={(e) => {
              // Don't navigate if a link inside was clicked
              if ((e.target as HTMLElement).closest("a")) return;
              router.push(`/feed/${post.id}`);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.target as HTMLElement).closest("a")) {
                router.push(`/feed/${post.id}`);
              }
            }}
            className="cursor-pointer"
          >
            <p className="mt-0.5 text-[15px] leading-[20px] text-text-primary whitespace-pre-wrap">
              {renderContentWithHashtags(post.content)}
            </p>
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border-custom">
              <OptimizedMediaImage
                src={post.media_urls[0]}
                alt="Post media"
                className="max-h-[510px]"
              />
            </div>
          )}

          {/* Poll */}
          {post.poll && <PollDisplay postId={post.id} poll={post.poll} />}

          {/* Engagement row — X-style */}
          <div className="mt-3 flex items-center justify-between max-w-[425px] -ml-2">
            {/* Reply */}
            <Link
              href={`/feed/${post.id}`}
              className="group inline-flex items-center gap-1"
            >
              <span className="inline-flex items-center justify-center size-[34px] rounded-full group-hover:bg-brand/10 transition-colors">
                <MessageCircle className="size-[18px] text-muted-text group-hover:text-brand" />
              </span>
              <span className="text-[13px] text-muted-text group-hover:text-brand">
                {post.comment_count > 0 ? post.comment_count : ""}
              </span>
            </Link>

            {/* Repost/Share */}
            <button className="group inline-flex items-center gap-1">
              <span className="inline-flex items-center justify-center size-[34px] rounded-full group-hover:bg-success/10 transition-colors">
                <Repeat2 className="size-[18px] text-muted-text group-hover:text-success" />
              </span>
              <span className="text-[13px] text-muted-text group-hover:text-success">
                {post.share_count > 0 ? post.share_count : ""}
              </span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className="group inline-flex items-center gap-1"
            >
              <span className={cn(
                "inline-flex items-center justify-center size-[34px] rounded-full transition-colors",
                liked ? "text-[#F91880]" : "group-hover:bg-[#F91880]/10"
              )}>
                <Heart
                  className={cn(
                    "size-[18px]",
                    liked
                      ? "fill-[#F91880] text-[#F91880]"
                      : "text-muted-text group-hover:text-[#F91880]"
                  )}
                />
              </span>
              <span className={cn(
                "text-[13px]",
                liked ? "text-[#F91880]" : "text-muted-text group-hover:text-[#F91880]"
              )}>
                {likeCount > 0 ? likeCount : ""}
              </span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className="group inline-flex items-center gap-1"
            >
              <span className={cn(
                "inline-flex items-center justify-center size-[34px] rounded-full transition-colors",
                bookmarked ? "text-brand" : "group-hover:bg-brand/10"
              )}>
                <Bookmark
                  className={cn(
                    "size-[18px]",
                    bookmarked
                      ? "fill-brand text-brand"
                      : "text-muted-text group-hover:text-brand"
                  )}
                />
              </span>
            </button>

            {/* Share */}
            <button className="group inline-flex items-center">
              <span className="inline-flex items-center justify-center size-[34px] rounded-full group-hover:bg-brand/10 transition-colors">
                <Share className="size-[18px] text-muted-text group-hover:text-brand" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
