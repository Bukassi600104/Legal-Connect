import { LogoMark } from "@/components/shared/logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LogoMark className="mx-auto size-12 animate-pulse" />
        <p className="mt-3 text-[15px] text-muted-text">Loading...</p>
      </div>
    </div>
  );
}
