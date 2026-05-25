import { cn } from "@/lib/utils";
import { POST_CATEGORY_LABELS, POST_CATEGORY_COLORS } from "@/lib/constants";
import type { PostCategory } from "@/types";

interface CategoryPillProps {
  category: PostCategory;
  size?: "sm" | "default";
  className?: string;
}

export function CategoryPill({
  category,
  size = "default",
  className,
}: CategoryPillProps) {
  const label = POST_CATEGORY_LABELS[category] || category;
  const colorClass = POST_CATEGORY_COLORS[category] || "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        className
      )}
    >
      {label}
    </span>
  );
}
