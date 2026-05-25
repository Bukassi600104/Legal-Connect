import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-[#EFF3F4] p-4">
        <Icon className="size-8 text-muted-text" />
      </div>
      <h3 className="text-lg font-extrabold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[15px] text-muted-text">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
