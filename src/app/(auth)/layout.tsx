import { LogoMark } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
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
