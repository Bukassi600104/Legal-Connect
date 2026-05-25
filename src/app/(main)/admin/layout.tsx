"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Users,
  BadgeCheck,
  Flag,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const adminLinks = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Verification", href: "/admin/verification", icon: BadgeCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Moderation", href: "/admin/moderation", icon: Flag },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const pathname = usePathname();

  if (profile?.role !== "admin") {
    return (
      <div className="px-8 py-16 text-center">
        <Shield className="size-10 text-muted-text mx-auto mb-3" />
        <h2 className="text-[31px] font-extrabold text-text-primary">
          Access Denied
        </h2>
        <p className="mt-2 text-[15px] text-muted-text">
          This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* X-style header with tabs */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom">
        <div className="px-4 h-[53px] flex items-center">
          <h1 className="text-xl font-extrabold text-text-primary">Admin</h1>
        </div>
        {/* X-style tab navigation */}
        <div className="flex overflow-x-auto">
          {adminLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-3 px-4 text-[14px] font-medium whitespace-nowrap transition-colors hover:bg-black/[0.03] relative min-w-0",
                  isActive
                    ? "font-bold text-text-primary"
                    : "text-muted-text"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
