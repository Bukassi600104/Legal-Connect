"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { NIGERIAN_STATES } from "@/types";

export default function LawyerSignupPage() {
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuthActions();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    yearsOfExperience: "",
    locationState: "",
    scn: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
    setValidationError(null);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locationState) {
      setValidationError("Please select your state.");
      return;
    }

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: "lawyer",
        accountType: "individual",
      });

      router.push("/dashboard");
    } catch {
      // Error handled by hook
    }
  };

  const displayError = validationError || error;

  return (
    <div>
      <Link
        href={step === 1 ? "/signup" : "#"}
        onClick={step === 2 ? (e) => { e.preventDefault(); setStep(1); } : undefined}
        className="mb-4 inline-flex items-center gap-1 text-[15px] text-muted-text hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <h1 className="text-[23px] font-extrabold text-text-primary">
        {step === 1 ? "Create lawyer account" : "Professional details"}
      </h1>
      <p className="mt-1 text-[15px] text-muted-text">
        {step === 1
          ? "Join Nigeria's legal marketplace"
          : "Tell us about your practice"}
      </p>

      {/* Step indicator */}
      <div className="mt-4 flex gap-2">
        <div
          className={`h-1 flex-1 rounded-full ${
            step >= 1 ? "bg-brand" : "bg-[#EFF3F4]"
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full ${
            step >= 2 ? "bg-brand" : "bg-[#EFF3F4]"
          }`}
        />
      </div>

      {displayError && (
        <div className="mt-4 rounded-xl bg-[#F4212E]/10 px-4 py-3 text-[15px] text-[#F4212E]">
          {displayError}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1} className="mt-5 space-y-3">
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
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Input
            placeholder="Supreme Court Number (optional)"
            value={formData.scn}
            onChange={(e) => updateField("scn", e.target.value)}
            className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
            disabled={loading}
          />
          <p className="text-[12px] text-muted-text -mt-1 ml-1">
            You can add this later during verification.
          </p>

          <Input
            type="number"
            placeholder="Years of experience"
            min="0"
            max="60"
            value={formData.yearsOfExperience}
            onChange={(e) => updateField("yearsOfExperience", e.target.value)}
            className="h-[42px] rounded-md border-border-custom text-[15px] focus-visible:ring-brand"
            disabled={loading}
          />

          <div>
            <Select
              value={formData.locationState}
              onValueChange={(value) => updateField("locationState", value ?? "")}
            >
              <SelectTrigger className="w-full h-[42px] rounded-md border-border-custom text-[15px]">
                <MapPin className="mr-2 size-4 text-muted-text" />
                <SelectValue placeholder="State of practice" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
      )}

      {step === 1 && (
        <>
          <div className="relative my-5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[13px] text-muted-text">
              or
            </span>
          </div>

          <p className="text-center text-[15px] text-muted-text">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
