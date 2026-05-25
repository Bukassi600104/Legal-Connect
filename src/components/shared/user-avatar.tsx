"use client";

import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface UserAvatarProps {
  user?: Pick<UserProfile, "full_name" | "avatar_url"> | null;
  size?: "sm" | "default" | "lg" | "xl";
  showOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "size-6",
  default: "size-8",
  lg: "size-10",
  xl: "size-14",
};

const sizeMap = {
  sm: "sm" as const,
  default: "default" as const,
  lg: "lg" as const,
  xl: "lg" as const,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  user,
  size = "default",
  showOnline = false,
  className,
}: UserAvatarProps) {
  const initials = user?.full_name ? getInitials(user.full_name) : "?";

  return (
    <Avatar size={sizeMap[size]} className={cn(sizeClasses[size], className)}>
      {user?.avatar_url ? (
        <AvatarImage src={user.avatar_url} alt={user.full_name || "User"} />
      ) : null}
      <AvatarFallback className="bg-brand/10 text-brand font-medium">
        {initials}
      </AvatarFallback>
      {showOnline && (
        <AvatarBadge className="bg-success ring-2 ring-white" />
      )}
    </Avatar>
  );
}
