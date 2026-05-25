import Link from "next/link";
import { Scale } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand/10">
          <Scale className="size-10 text-brand" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-text-primary">404</h1>
        <h2 className="mt-2 text-lg font-extrabold text-text-primary">
          Page Not Found
        </h2>
        <p className="mt-3 text-[15px] text-muted-text leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-9 items-center rounded-full border border-border-custom px-5 text-[15px] font-bold text-text-primary hover:bg-[#EFF3F4] transition-colors"
          >
            Explore Lawyers
          </Link>
        </div>
      </div>
    </div>
  );
}
