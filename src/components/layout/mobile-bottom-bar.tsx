"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, MessageCircle, PenSquare, Search } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Briefs", href: "/feed", icon: Home },
  { label: "Market", href: "/explore", icon: Search },
  { label: "Inbox", href: "/messages", icon: MessageCircle },
  { label: "Saved", href: "/bookmarks", icon: Bell },
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
      <Link
        href="/feed?compose=true"
        className="fixed bottom-20 right-4 z-50 flex size-12 items-center justify-center rounded-lg bg-brand text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-dark lg:hidden"
        aria-label="Share insight"
      >
        <PenSquare className="size-5" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-custom bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md lg:hidden">
        <div className="grid h-16 grid-cols-4 items-center px-2">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
                  active
                    ? "bg-brand-light text-brand"
                    : "text-muted-text hover:bg-[#F8FAFC] hover:text-text-primary"
                )}
              >
                <tab.icon className={cn("size-5", active ? "stroke-[2.4]" : "stroke-[1.8]")} />
                <span className="mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
