import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
};

export function LoadingSpinner({
  size = "default",
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-brand", sizeClasses[size])} />
      {text && <span className="text-[15px] text-muted-text">{text}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}
