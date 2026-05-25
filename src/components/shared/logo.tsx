import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  href?: string;
}

const sizeMap = {
  sm: "size-5",
  default: "size-6",
  lg: "size-8",
};

const textSizeMap = {
  sm: "text-base",
  default: "text-lg",
  lg: "text-2xl",
};

export function Logo({
  className,
  size = "default",
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex items-center justify-center rounded-full bg-brand p-1.5">
        <Scale className={cn("text-white", sizeMap[size])} />
      </span>
      {showText && (
        <span className={cn("font-bold text-text-primary tracking-tight", textSizeMap[size])}>
          Legal<span className="text-brand">Connect</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
