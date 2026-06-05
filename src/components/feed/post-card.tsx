"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CategoryPill } from "@/components/shared/category-pill";
import { OptimizedAvatar, OptimizedMediaImage } from "@/components/shared/optimized-image";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { PollDisplay } from "@/components/feed/poll-display";
import { useAuth } from "@/components/providers/auth-provider";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";
import { cn } from "@/lib/utils";
import type { LawyerProfile, Post, UserProfile } from "@/types";

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
          className="font-semibold text-brand hover:underline"
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
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmark_count ?? 0);
  const [shared, setShared] = useState(post.is_shared ?? false);
  const [shareCount, setShareCount] = useState(post.share_count);
  const [actionLoading, setActionLoading] = useState(false);

  const createdAt = post.created_at
    ? typeof post.created_at === "string"
      ? new Date(post.created_at)
      : post.created_at.toDate?.() ?? new Date()
    : new Date();

  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: false });

  const authorHref = post.author?.handle
    ? `/profile/${post.author.handle}`
    : post.author_profile?.slug
      ? `/lawyer/${post.author_profile.slug}`
      : "#";
  const authorIsSubscribed =
    post.author?.role === "lawyer"
      ? isPaidSubscriptionTier(post.author_profile?.subscription_tier)
      : Boolean(post.author?.is_premium);

  const handleLike = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await fetch("/api/posts/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, interaction: "like" }),
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await fetch("/api/posts/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, interaction: "bookmark" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Post interaction failed");
      }

      setBookmarked(Boolean(data.active));
      if (typeof data.bookmark_count === "number") {
        setBookmarkCount(data.bookmark_count);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await fetch("/api/posts/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, interaction: "share" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Post interaction failed");
      }

      setShared(Boolean(data.active));
      if (typeof data.share_count === "number") {
        setShareCount(data.share_count);
      }
    } catch (error) {
      console.error("Error toggling repost:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareLink = async () => {
    const url = `${window.location.origin}/feed/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "LegalConnect post",
          text: post.content.slice(0, 120),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // User cancelled native share.
    }
  };

  return (
    <article className="mx-4 my-3 rounded-lg border border-border-custom bg-white p-4 shadow-sm transition-colors hover:border-brand/30">
      <div className="flex gap-3">
        <Link href={authorHref} className="shrink-0">
          {post.author?.avatar_url ? (
            <OptimizedAvatar
              src={post.author.avatar_url}
              alt={post.author.full_name || "User"}
              className="size-10"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
              {post.author?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Link
                  href={authorHref}
                  className="truncate text-[15px] font-black text-text-primary hover:text-brand"
                >
                  {post.author?.full_name || "Unknown"}
                </Link>
                {authorIsSubscribed && <PremiumBadge size="sm" />}
                {post.author_profile && (
                  <VerificationBadge
                    status={post.author_profile.verification_status}
                    size="sm"
                  />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-text">
                {post.author?.handle && (
                  <span className="truncate">@{post.author.handle}</span>
                )}
                <span>{timeAgo}</span>
              </div>
            </div>
            <button
              className="-mr-2 inline-flex size-8 items-center justify-center rounded-lg text-muted-text transition-colors hover:bg-brand-light hover:text-brand"
              aria-label="More actions"
            >
              <MoreHorizontal className="size-[18px]" />
            </button>
          </div>

          {post.is_thread_starter && (
            <Link
              href={`/feed/${post.id}`}
              className="mt-2 inline-flex text-[13px] font-semibold text-brand hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Open related brief
            </Link>
          )}

          {post.category && post.category !== "general" && (
            <div className="mt-2">
              <CategoryPill category={post.category} size="sm" />
            </div>
          )}

          <div
            role="link"
            tabIndex={0}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) return;
              router.push(`/feed/${post.id}`);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.target as HTMLElement).closest("a")) {
                router.push(`/feed/${post.id}`);
              }
            }}
            className="mt-3 cursor-pointer border-l-2 border-brand/20 pl-3"
          >
            <p className="whitespace-pre-wrap text-[15px] leading-6 text-text-primary">
              {renderContentWithHashtags(post.content)}
            </p>
          </div>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-border-custom">
              <OptimizedMediaImage
                src={post.media_urls[0]}
                alt="Post media"
                className="max-h-[510px]"
              />
            </div>
          )}

          {post.poll && <PollDisplay postId={post.id} poll={post.poll} />}

          <div className="mt-4 grid grid-cols-5 gap-2 border-t border-border-custom pt-3 text-muted-text">
            <Link
              href={`/feed/${post.id}`}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg transition-colors hover:bg-brand-light hover:text-brand"
            >
              <MessageCircle className="size-[17px]" />
              <span className="text-[13px]">
                {post.comment_count > 0 ? post.comment_count : ""}
              </span>
            </Link>

            <button
              onClick={handleRepost}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1 rounded-lg transition-colors hover:bg-success/10 hover:text-success",
                shared && "text-success"
              )}
            >
              <Repeat2 className="size-[17px]" />
              <span className="text-[13px]">
                {shareCount > 0 ? shareCount : ""}
              </span>
            </button>

            <button
              onClick={handleLike}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1 rounded-lg transition-colors hover:bg-red-accent/10 hover:text-red-accent",
                liked && "text-red-accent"
              )}
            >
              <Heart
                className={cn(
                  "size-[17px]",
                  liked && "fill-red-accent text-red-accent"
                )}
              />
              <span className="text-[13px]">
                {likeCount > 0 ? likeCount : ""}
              </span>
            </button>

            <button
              onClick={handleBookmark}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1 rounded-lg transition-colors hover:bg-gold-light hover:text-gold",
                bookmarked && "text-gold"
              )}
            >
              <Bookmark
                className={cn(
                  "size-[17px]",
                  bookmarked && "fill-gold text-gold"
                )}
              />
              <span className="text-[13px]">
                {bookmarkCount > 0 ? bookmarkCount : ""}
              </span>
            </button>

            <button
              onClick={handleShareLink}
              className="inline-flex h-9 items-center justify-center rounded-lg transition-colors hover:bg-brand-light hover:text-brand"
            >
              <Share className="size-[17px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
