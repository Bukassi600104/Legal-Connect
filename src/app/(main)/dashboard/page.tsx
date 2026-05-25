"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Users,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  MessageCircle,
  BadgeCheck,
  ArrowRight,
  PenSquare,
  CreditCard,
  Shield,
} from "lucide-react";
import { TierBadge } from "@/components/shared/tier-badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import type { Post, Consultation } from "@/types";

export const dynamic = "force-dynamic";

interface DashboardStats {
  followers: number;
  posts: number;
  reviews: number;
  rating: number;
}

export default function DashboardPage() {
  const { user, profile, lawyerProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !lawyerProfile) return;

    async function fetchDashboard() {
      try {
        setStats({
          followers: lawyerProfile!.follower_count,
          posts: lawyerProfile!.post_count,
          reviews: lawyerProfile!.rating_count,
          rating: lawyerProfile!.rating_avg,
        });

        const postsQuery = query(
          collection(db, "posts"),
          where("author_id", "==", user!.uid),
          orderBy("created_at", "desc"),
          firestoreLimit(5)
        );
        try {
          const postsSnap = await getDocs(postsQuery);
          setRecentPosts(
            postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
          );
        } catch {
          // Index might not exist
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user, lawyerProfile]);

  if (loading) return <PageLoader />;

  if (!profile || profile.role !== "lawyer") {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-[15px] text-muted-text">
          The dashboard is available for lawyer accounts only.
        </p>
      </div>
    );
  }

  const statItems = [
    { label: "Followers", value: stats?.followers ?? 0, icon: Users },
    { label: "Posts", value: stats?.posts ?? 0, icon: FileText },
    { label: "Reviews", value: stats?.reviews ?? 0, icon: Star },
    {
      label: "Rating",
      value: stats?.rating ? stats.rating.toFixed(1) : "—",
      icon: TrendingUp,
    },
  ];

  const quickLinks = [
    { label: "Edit Profile", desc: "Update your details", href: "/dashboard/profile", icon: BadgeCheck },
    { label: "Messages", desc: "View conversations", href: "/messages", icon: MessageCircle },
    { label: "Consultations", desc: "Manage bookings", href: "/consultations", icon: Calendar },
    { label: "Verification", desc: lawyerProfile?.verification_status === "verified" ? "Verified" : "Get verified", href: "/dashboard/verification", icon: Shield },
    { label: "Subscription", desc: `${lawyerProfile?.subscription_tier || "Free"} plan`, href: "/dashboard/subscription", icon: CreditCard },
  ];

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary">Dashboard</h1>
        </div>
        <Link
          href="/feed?compose=true"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-dark transition-colors"
        >
          <PenSquare className="size-3.5" />
          Post
        </Link>
      </div>

      {/* Welcome */}
      <div className="px-4 py-4 border-b border-border-custom">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xl">
            {profile.full_name?.charAt(0)?.toUpperCase() || "L"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[17px] font-bold text-text-primary">
                {profile.full_name}
              </h2>
              {lawyerProfile?.verification_status === "verified" && (
                <BadgeCheck className="size-[18px] text-brand" />
              )}
              <TierBadge tier={lawyerProfile!.subscription_tier} size="sm" />
            </div>
            <p className="text-[13px] text-muted-text">
              @{lawyerProfile?.slug || "lawyer"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border-b border-border-custom">
        {statItems.map((stat) => (
          <div key={stat.label} className="py-4 text-center border-r border-border-custom last:border-r-0">
            <p className="text-[18px] font-extrabold text-text-primary">{stat.value}</p>
            <p className="text-[12px] text-muted-text mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 px-4 py-3 border-b border-border-custom transition-colors hover:bg-black/[0.03]"
          >
            <link.icon className="size-5 text-muted-text" />
            <div className="flex-1">
              <p className="text-[15px] font-medium text-text-primary">{link.label}</p>
              <p className="text-[13px] text-muted-text">{link.desc}</p>
            </div>
            <ArrowRight className="size-4 text-muted-text" />
          </Link>
        ))}
      </div>

      {/* Recent posts */}
      <div className="border-b border-border-custom">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-[15px] font-bold text-text-primary">Recent Posts</h3>
          <Link
            href="/dashboard/posts"
            className="text-[13px] font-medium text-brand hover:text-brand-dark"
          >
            See all
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="px-4 pb-4">
            <p className="text-[15px] text-muted-text">
              You haven&apos;t posted anything yet.
            </p>
            <Link
              href="/feed?compose=true"
              className="mt-2 inline-flex items-center gap-1 text-[15px] font-medium text-brand hover:text-brand-dark"
            >
              Create your first post
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/feed/${post.id}`}
              className="block px-4 py-3 border-t border-border-custom hover:bg-black/[0.03] transition-colors"
            >
              <p className="text-[15px] text-text-primary line-clamp-2 leading-5">
                {post.content}
              </p>
              <div className="mt-1.5 flex gap-4 text-[13px] text-muted-text">
                <span>{post.like_count} likes</span>
                <span>{post.comment_count} comments</span>
                <span>{post.view_count} views</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
