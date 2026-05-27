"use client";

import Link from "next/link";
import {
  Settings,
} from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { LogoMark } from "@/components/shared/logo";
import { useAuth } from "@/components/providers/auth-provider";

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user, profile, loading: authLoading } = useAuth();

  // On desktop, X hides the top navbar (sidebar is primary).
  // On mobile, show the X-style top bar: avatar left, logo center, settings right
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-white/85 backdrop-blur-md lg:hidden">
      <div className="flex h-[53px] items-center justify-between px-4">
        {/* Left: User avatar (opens mobile nav) or back arrow */}
        <div className="flex items-center">
          {authLoading ? (
            <div className="size-8" />
          ) : user ? (
            <button
              onClick={onMobileMenuToggle}
              className="size-8 rounded-full overflow-hidden"
            >
              {profile?.avatar_url ? (
                <OptimizedAvatar
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  className="size-8"
                  sizes="32px"
                />
              ) : (
                <div className="size-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </button>
          ) : (
            <div className="size-8" />
          )}
        </div>

        {/* Center: Logo */}
        <Link href="/feed" className="inline-flex items-center justify-center">
          <LogoMark className="size-8" />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {authLoading ? (
            <div className="size-8" />
          ) : user ? (
            <Link
              href="/settings"
              className="inline-flex items-center justify-center size-8 rounded-full text-text-primary hover:bg-[#E7E9EA]"
            >
              <Settings className="size-5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-8 items-center rounded-full px-4 text-sm font-bold text-brand border border-brand/30 hover:bg-brand/5 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-8 items-center rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
