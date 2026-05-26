import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedAvatarProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

interface OptimizedMediaImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

function shouldSkipOptimization(src: string) {
  return src.includes("api.dicebear.com");
}

export function OptimizedAvatar({
  src,
  alt,
  className,
  sizes = "40px",
}: OptimizedAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        unoptimized={shouldSkipOptimization(src)}
      />
    </span>
  );
}

export function OptimizedMediaImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 600px",
}: OptimizedMediaImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={675}
      sizes={sizes}
      className={cn("h-auto w-full object-cover", className)}
      unoptimized={shouldSkipOptimization(src)}
    />
  );
}

export function OptimizedFillImage({
  src,
  alt,
  className,
  sizes = "100vw",
}: OptimizedMediaImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      unoptimized={shouldSkipOptimization(src)}
    />
  );
}
