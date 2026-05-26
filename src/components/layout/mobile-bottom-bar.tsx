"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, Bell, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const tabs = [
  { label: "Home", href: "/feed", icon: Home },
  { label: "Search", href: "/explore", icon: Search },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Notifications", href: "/bookmarks", icon: Bell },
];

export function MobileBottomBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Floating compose button — all authenticated users */}
      <Link
        href="/feed?compose=true"
        className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-dark transition-colors lg:hidden"
      >
        <PenSquare className="size-6" />
      </Link>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-custom bg-white/95 backdrop-blur-md lg:hidden">
        <div className="flex h-[53px] items-center justify-around">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center justify-center size-12 rounded-full transition-colors",
                isActive(tab.href)
                  ? "text-text-primary"
                  : "text-muted-text"
              )}
            >
              <tab.icon
                className={cn(
                  "size-[26px]",
                  isActive(tab.href) ? "stroke-[2.5]" : "stroke-[1.5]"
                )}
              />
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
