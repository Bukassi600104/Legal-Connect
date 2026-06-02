"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthActions } from "@/hooks/use-auth-actions";

export default function ClientSignupPage() {
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuthActions();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: "client",
        accountType: "individual",
      });
      router.push("/feed");
    } catch {
      // Error handled by hook
    }
  };

  const handleGoogleSignUp = async () => {
    const params = new URLSearchParams({
      provider: "google",
      role: "client",
      redirectTo: "/feed",
    });
    router.push(`/auth/callback?${params.toString()}`);
  };

  const displayError = validationError || error;

  return (
    <div>
      <Link
        href="/signup"
        className="mb-4 inline-flex items-center gap-1 text-[15px] text-muted-text hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <h1 className="text-[23px] font-extrabold text-text-primary">
        Create your account
      </h1>

      {displayError && (
        <div className="mt-4 rounded-xl bg-[#F4212E]/10 px-4 py-3 text-[15px] text-[#F4212E]">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Input
          placeholder="Full name"
          value={formData.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
          required
          disabled={loading}
        />
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
          required
          disabled={loading}
        />
        <Input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
          disabled={loading}
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="h-[42px] rounded-md border-border-custom text-[15px] pr-10 focus-visible:ring-brand"
            required
            minLength={6}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
          required
          disabled={loading}
        />

        <button
          type="submit"
          className="w-full h-[42px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors mt-2"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="relative my-5">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[13px] text-muted-text">
          or
        </span>
      </div>

      <button
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 h-[40px] rounded-full border border-border-custom text-[15px] font-medium text-text-primary hover:bg-[#E7E9EA] transition-colors disabled:opacity-50"
      >
        <svg className="size-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </button>

      <p className="mt-5 text-center text-[15px] text-muted-text">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
