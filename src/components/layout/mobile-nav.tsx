"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  Calendar,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Shield,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TierBadge } from "@/components/shared/tier-badge";
import { LogoMark } from "@/components/shared/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavLinkItem {
  label: string;
  href: string;
  icon: typeof Home;
}

function MobileNavLink({
  link,
  active,
  onClick,
}: {
  link: NavLinkItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[15px] font-semibold transition-colors",
        active
          ? "border-brand/15 bg-brand-light text-brand"
          : "text-text-primary hover:border-border-custom hover:bg-[#F8FAFC]"
      )}
    >
      <link.icon
        className={cn("size-5 shrink-0", active ? "stroke-[2.4]" : "stroke-[1.8]")}
      />
      {link.label}
    </Link>
  );
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { user, profile, lawyerProfile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  };

  const handleNavigate = () => {
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    router.push("/");
  };

  const mainLinks: NavLinkItem[] = [
    { label: "Briefings", href: "/feed", icon: Home },
    { label: "Marketplace", href: "/explore", icon: Search },
    { label: "Inbox", href: "/messages", icon: MessageCircle },
    { label: "Saved", href: "/bookmarks", icon: Bookmark },
    { label: "Consults", href: "/consultations", icon: Calendar },
  ];

  if (profile?.role === "lawyer" && lawyerProfile?.slug) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false} className="w-[300px] p-0">
        <SheetHeader className="border-b border-border-custom p-4">
          <SheetTitle className="text-left">
            {profile ? (
              <div className="rounded-lg border border-border-custom bg-[#F8FAFC] p-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black leading-tight text-text-primary">
                      {profile.full_name || "User"}
                    </p>
                    <p className="truncate text-[13px] font-normal leading-tight text-muted-text">
                      @{profile.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}
                    </p>
                  </div>
                </div>
                {lawyerProfile && (
                  <TierBadge tier={lawyerProfile.subscription_tier} size="sm" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <LogoMark className="size-6" />
                </span>
                <span className="font-black text-text-primary">
                  LegalConnect NG
                </span>
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-3">
            {mainLinks.map((link) => (
              <MobileNavLink
                key={link.href}
                link={link}
                active={isActive(link.href)}
                onClick={handleNavigate}
              />
            ))}

            <Separator className="my-2" />

            <MobileNavLink
              link={{ label: "Settings", href: "/settings", icon: Settings }}
              active={isActive("/settings")}
              onClick={handleNavigate}
            />

            {user && (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-[15px] font-semibold text-text-primary transition-colors hover:border-border-custom hover:bg-[#F8FAFC]"
              >
                <LogOut className="size-5 stroke-[1.8]" />
                Log out
              </button>
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
