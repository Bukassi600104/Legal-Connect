"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Search,
  MessageCircle,
  Calendar,
  Bookmark,
  User,
  Shield,
  Settings,
  LogOut,
  Scale,
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
        "inline-flex items-center gap-5 rounded-full px-3 py-3 text-xl transition-colors hover:bg-[#E7E9EA]",
        active ? "font-bold text-text-primary" : "font-normal text-text-primary"
      )}
    >
      <link.icon
        className={cn("size-[26px]", active ? "stroke-[2.5]" : "stroke-[1.5]")}
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
    { label: "Home", href: "/feed", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    { label: "Consultations", href: "/consultations", icon: Calendar },
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
      <SheetContent side="left" showCloseButton={false} className="w-[280px] p-0">
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left">
              {/* User info — X-style */}
              {profile ? (
                <div>
                  <div className="size-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold mb-2">
                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <p className="text-[15px] font-extrabold text-text-primary leading-tight">
                    {profile.full_name || "User"}
                  </p>
                  <p className="text-[13px] font-normal text-muted-text leading-tight">
                    @{profile.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}
                  </p>
                  {lawyerProfile && (
                    <div className="mt-2">
                      <TierBadge tier={lawyerProfile.subscription_tier} size="sm" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Scale className="size-6 text-brand" />
                  <span className="font-bold text-text-primary">LegalConnect</span>
                </div>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 p-2">
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
                className="inline-flex items-center gap-5 rounded-full px-3 py-3 text-xl font-normal text-text-primary transition-colors hover:bg-[#E7E9EA] w-full text-left"
              >
                <LogOut className="size-[26px] stroke-[1.5]" />
                Log out
              </button>
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
