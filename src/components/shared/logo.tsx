import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  href?: string;
}

interface LogoMarkProps {
  className?: string;
  title?: string;
}

const markSizeMap = {
  sm: "size-7",
  default: "size-9",
  lg: "size-12",
};

const textSizeMap = {
  sm: "text-base",
  default: "text-lg",
  lg: "text-2xl",
};

export function LogoMark({ className, title = "LegalConnect NG" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="18" fill="#1A8CD8" />
      <path
        d="M20 17V47H38"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 21C39.4 16.5 29 18.7 29 32C29 45.2 39.4 47.5 45 43"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M28 25H42M35 25V18"
        stroke="#DFF3FF"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M25 31L21 38H29L25 31ZM45 31L41 38H49L45 31Z"
        fill="#DFF3FF"
      />
    </svg>
  );
}

export function Logo({
  className,
  size = "default",
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markSizeMap[size]} />
      {showText && (
        <span
          className={cn(
            "font-extrabold text-text-primary tracking-normal",
            textSizeMap[size]
          )}
        >
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
