import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border-custom px-3 py-2 text-[14px] font-bold text-muted-text transition-colors hover:bg-[#F8FAFC] hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Back home
      </Link>
      <div className="mb-8">
        <LogoMark className="size-12 mx-auto" />
      </div>
      <div className="w-full max-w-[364px]">{children}</div>
      <p className="mt-8 text-center text-[13px] text-muted-text">
        &copy; {new Date().getFullYear()} LegalConnect NG
      </p>
    </div>
  );
}
