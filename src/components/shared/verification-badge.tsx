import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const iconSizes = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
};

const statusConfig: Record<
  VerificationStatus,
  { icon: typeof BadgeCheck; color: string; label: string }
> = {
  verified: {
    icon: BadgeCheck,
    color: "text-brand",
    label: "Verified Lawyer",
  },
  pending: {
    icon: Clock,
    color: "text-[#FFD700]",
    label: "Verification Pending",
  },
  rejected: {
    icon: ShieldX,
    color: "text-[#F4212E]",
    label: "Verification Rejected",
  },
  unverified: {
    icon: ShieldX,
    color: "text-muted-text",
    label: "Not Yet Verified",
  },
};

export function VerificationBadge({
  status,
  size = "default",
  className,
}: VerificationBadgeProps) {
  if (status === "unverified") return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className={cn("inline-flex cursor-default", className)} />}
      >
        <Icon className={cn(iconSizes[size], config.color)} />
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
