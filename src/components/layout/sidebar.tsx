"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Calendar,
  Home,
  MessageCircle,
  MoreHorizontal,
  PenSquare,
  Search,
  Settings,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { LogoMark } from "@/components/shared/logo";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { PremiumBadge } from "@/components/shared/premium-badge";
import { cn } from "@/lib/utils";

interface SidebarLink {
  label: string;
  href: string;
  icon: typeof Home;
  iconColor?: string;
}

function NavLink({ link, active }: { link: SidebarLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[15px] font-semibold transition-colors",
        active
          ? "border-brand/15 bg-brand-light text-brand shadow-sm"
          : "text-text-primary hover:border-border-custom hover:bg-[#F8FAFC]"
      )}
    >
      <link.icon
        className={cn(
          "size-5 shrink-0",
          active ? "stroke-[2.4]" : "stroke-[1.8]",
          link.iconColor
        )}
      />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { user, profile, lawyerProfile } = useAuth();
  const pathname = usePathname();

  const mainLinks: SidebarLink[] = [
    { label: "Briefings", href: "/feed", icon: Home },
    { label: "Marketplace", href: "/explore", icon: Search },
    { label: "Inbox", href: "/messages", icon: MessageCircle },
    { label: "Saved", href: "/bookmarks", icon: Bookmark },
    { label: "Consults", href: "/consultations", icon: Calendar },
  ];

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
    mainLinks.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  mainLinks.push({
    label: "Plans",
    href: "/premium",
    icon: Star,
    iconColor: profile?.is_premium ? "text-gold fill-gold" : undefined,
  });
  mainLinks.push({ label: "Settings", href: "/settings", icon: Settings });

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:block lg:py-4">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-lg border border-border-custom bg-white p-3 shadow-sm">
        <Link
          href="/feed"
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#F8FAFC]"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <LogoMark className="size-7" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-black leading-tight text-text-primary">
              LegalConnect NG
            </span>
            <span className="block truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-text">
              Legal marketplace
            </span>
          </span>
        </Link>

        <nav className="mt-4 flex flex-col gap-1">
          {mainLinks.map((link) => (
            <NavLink key={link.href} link={link} active={isActive(link.href)} />
          ))}
        </nav>

        {user && (
          <Link
            href="/feed?compose=true"
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
          >
            <PenSquare className="size-4" />
            Share insight
          </Link>
        )}

        <div className="flex-1" />

        {user && profile && (
          <Link
            href={profile.handle ? `/profile/${profile.handle}` : "/settings"}
            className="mt-4 flex items-center gap-3 rounded-lg border border-border-custom bg-[#F8FAFC] p-3 transition-colors hover:border-brand/30 hover:bg-brand-light"
          >
            {profile.avatar_url ? (
              <OptimizedAvatar
                src={profile.avatar_url}
                alt={profile.full_name}
                className="size-10"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate text-[14px] font-bold leading-tight text-text-primary">
                  {profile.full_name || "User"}
                </p>
                {profile.is_premium && <PremiumBadge size="sm" />}
              </div>
              <p className="truncate text-[12px] leading-tight text-muted-text">
                @{profile.handle || profile.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}
              </p>
            </div>
            <MoreHorizontal className="size-4 text-muted-text" />
          </Link>
        )}
      </div>
    </aside>
  );
}
