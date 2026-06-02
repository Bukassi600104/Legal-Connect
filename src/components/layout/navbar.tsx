"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/optimized-image";
import { LogoMark } from "@/components/shared/logo";
import { useAuth } from "@/components/providers/auth-provider";

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user, profile, loading: authLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-white/95 shadow-sm backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          {authLoading ? (
            <div className="size-9" />
          ) : user ? (
            <button
              onClick={onMobileMenuToggle}
              className="size-9 overflow-hidden rounded-lg border border-border-custom bg-white"
              aria-label="Open menu"
            >
              {profile?.avatar_url ? (
                <OptimizedAvatar
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  className="size-9"
                  sizes="36px"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </button>
          ) : (
            <div className="size-9" />
          )}
        </div>

        <Link href="/feed" className="inline-flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
            <LogoMark className="size-6" />
          </span>
          <span className="text-[15px] font-black text-text-primary">
            LegalConnect NG
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {authLoading ? (
            <div className="size-9" />
          ) : user ? (
            <Link
              href="/settings"
              className="inline-flex size-9 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-[#F8FAFC]"
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg border border-brand/30 px-3 text-sm font-bold text-brand transition-colors hover:bg-brand-light"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
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
