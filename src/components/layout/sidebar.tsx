"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  MessageCircle,
  Calendar,
  Bookmark,
  User,
  Shield,
  Settings,
  MoreHorizontal,
  Bell,
  Scale,
  PenSquare,
  Star,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { cn } from "@/lib/utils";

interface SidebarLink {
  label: string;
  href: string;
  icon: typeof Home;
  iconColor?: string;
}

function NavLink({
  link,
  active,
}: {
  link: SidebarLink;
  active: boolean;
}) {
  return (
    <Link
      href={link.href}
      className={cn(
        "inline-flex items-center gap-5 rounded-full px-4 py-3 text-xl transition-colors hover:bg-[#E7E9EA]",
        active ? "font-bold text-text-primary" : "font-normal text-text-primary"
      )}
    >
      <link.icon
        className={cn(
          "size-[26px]",
          active ? "stroke-[2.5]" : "stroke-[1.5]",
          link.iconColor
        )}
      />
      <span className="hidden xl:inline">{link.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { user, profile, lawyerProfile } = useAuth();
  const pathname = usePathname();

  const mainLinks: SidebarLink[] = [
    { label: "Home", href: "/feed", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    { label: "Consultations", href: "/consultations", icon: Calendar },
  ];

  // Profile link — use handle-based universal profile if available
  if (profile?.handle) {
    mainLinks.push({
      label: "Profile",
      href: `/profile/${profile.handle}`,
      icon: User,
    });
  } else if (profile?.role === "lawyer" && lawyerProfile?.slug) {
    mainLinks.push({
      label: "Profile",
      href: `/lawyer/${lawyerProfile.slug}`,
      icon: User,
    });
  }

  if (profile?.role === "admin") {
    mainLinks.push({
      label: "Admin",
      href: "/admin",
      icon: Shield,
    });
  }

  // Premium link — gold icon if user is premium
  mainLinks.push({
    label: "Premium",
    href: "/premium",
    icon: Star,
    iconColor: profile?.is_premium ? "text-[#FFD700] fill-[#FFD700]" : undefined,
  });

  mainLinks.push({ label: "Settings", href: "/settings", icon: Settings });

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex lg:w-[275px] lg:flex-col lg:items-end border-r border-border-custom">
      <div className="fixed top-0 flex h-screen w-[275px] flex-col items-stretch px-3 py-1">
        {/* Logo */}
        <div className="px-4 py-3">
          <Link
            href="/feed"
            className="inline-flex size-[50px] items-center justify-center rounded-full transition-colors hover:bg-brand/10"
          >
            <Scale className="size-7 text-brand" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5">
          {mainLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
            />
          ))}
        </nav>

        {/* Post button — all authenticated users */}
        {user && (
          <Link
            href="/feed?compose=true"
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-[17px] font-bold text-white transition-colors hover:bg-brand-dark"
          >
            <span className="hidden xl:inline">Post</span>
            <PenSquare className="size-5 xl:hidden" />
          </Link>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User profile at bottom — X-style */}
        {user && profile && (
          <Link
            href={profile.handle ? `/profile/${profile.handle}` : "/settings"}
            className="mb-3 flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-[#E7E9EA]"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden xl:block flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[15px] font-bold text-text-primary truncate leading-tight">
                  {profile.full_name || "User"}
                </p>
                {profile.is_premium && <PremiumBadge size="sm" />}
              </div>
              <p className="text-[13px] text-muted-text truncate leading-tight">
                @{profile.handle || profile.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}
              </p>
            </div>
            <MoreHorizontal className="hidden xl:block size-5 text-muted-text" />
          </Link>
        )}
      </div>
    </aside>
  );
}
