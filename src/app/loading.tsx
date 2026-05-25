import { Scale } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Scale className="mx-auto size-10 text-brand animate-pulse" />
        <p className="mt-3 text-[15px] text-muted-text">Loading...</p>
      </div>
    </div>
  );
}
