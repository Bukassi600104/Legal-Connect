"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Globe,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import { NIGERIAN_STATES, SPECIALIZATION_SEEDS, type Education } from "@/types";

export const dynamic = "force-dynamic";

export default function EditLawyerProfilePage() {
  const { user, lawyerProfile, refreshProfile } = useAuth();

  const [bio, setBio] = useState(lawyerProfile?.bio || "");
  const [locationState, setLocationState] = useState(
    lawyerProfile?.location_state || ""
  );
  const [locationCity, setLocationCity] = useState(
    lawyerProfile?.location_city || ""
  );
  const [yearsExp, setYearsExp] = useState(
    lawyerProfile?.years_of_experience?.toString() || ""
  );
  const [scn, setScn] = useState(lawyerProfile?.scn || "");
  const [nbaBranch, setNbaBranch] = useState(lawyerProfile?.nba_branch || "");
  const [languages, setLanguages] = useState(
    lawyerProfile?.languages?.join(", ") || "English"
  );
  const [specializations, setSpecializations] = useState<string[]>(
    lawyerProfile?.specialization_ids || []
  );
  const [feeMin, setFeeMin] = useState(
    lawyerProfile?.fee_range_min?.toString() || ""
  );
  const [feeMax, setFeeMax] = useState(
    lawyerProfile?.fee_range_max?.toString() || ""
  );
  const [availability, setAvailability] = useState(
    lawyerProfile?.availability_status || "accepting"
  );
  const [education, setEducation] = useState<Education[]>(
    lawyerProfile?.education || []
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addEducation() {
    setEducation((prev) => [
      ...prev,
      { institution: "", degree: "", year: new Date().getFullYear() },
    ]);
  }

  function removeEducation(index: number) {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEducation(
    index: number,
    field: keyof Education,
    value: string | number
  ) {
    setEducation((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
  }

  function toggleSpecialization(specId: string) {
    setSpecializations((prev) =>
      prev.includes(specId)
        ? prev.filter((id) => id !== specId)
        : [...prev, specId]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const langArray = languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const response = await fetch("/api/lawyer-profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        bio: bio.trim() || null,
        location_state: locationState,
        location_city: locationCity.trim() || null,
        years_of_experience: yearsExp ? parseInt(yearsExp) : null,
        scn: scn.trim() || null,
        nba_branch: nbaBranch.trim() || null,
        languages: langArray,
        specialization_ids: specializations,
        fee_range_min: feeMin ? parseInt(feeMin) : null,
        fee_range_max: feeMax ? parseInt(feeMax) : null,
        availability_status: availability,
        education: education.filter((e) => e.institution && e.degree),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Profile update failed");
      }

      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center gap-6">
        <Link
          href="/dashboard"
          className="size-9 flex items-center justify-center rounded-full hover:bg-black/[0.07] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-extrabold text-text-primary">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="divide-y divide-border-custom">
        {/* Bio */}
        <div className="px-4 py-4">
          <label className="text-[13px] font-medium text-muted-text block mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about yourself..."
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-border-custom bg-transparent p-3 text-[15px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
          <p className="mt-1 text-[12px] text-muted-text text-right">
            {bio.length}/1000
          </p>
        </div>

        {/* Location & Experience */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
            <MapPin className="size-4 text-brand" />
            Location & Experience
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">State</label>
              <Select value={locationState} onValueChange={(v) => setLocationState(v ?? "")}>
                <SelectTrigger className="h-[38px] rounded-lg border-border-custom text-[14px]">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">City</label>
              <Input
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Ikeja"
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">Years of Experience</label>
              <Input
                type="number"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                min="0"
                max="60"
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">SCN</label>
              <Input
                value={scn}
                onChange={(e) => setScn(e.target.value)}
                placeholder="SC/12345"
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-muted-text block mb-1">NBA Branch</label>
            <Input
              value={nbaBranch}
              onChange={(e) => setNbaBranch(e.target.value)}
              placeholder="e.g. Lagos"
              className="h-[38px] rounded-lg border-border-custom text-[14px]"
            />
          </div>
        </div>

        {/* Specializations */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
            <Briefcase className="size-4 text-brand" />
            Specializations
          </h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATION_SEEDS.map((spec) => (
              <button
                key={spec.slug}
                type="button"
                onClick={() => toggleSpecialization(spec.slug)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  specializations.includes(spec.slug)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-custom text-muted-text hover:border-brand/30"
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
            <Globe className="size-4 text-brand" />
            Languages
          </h3>
          <Input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder="English, Yoruba, Igbo"
            className="h-[38px] rounded-lg border-border-custom text-[14px]"
          />
          <p className="text-[12px] text-muted-text">Comma-separated</p>
        </div>

        {/* Fees */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="text-[15px] font-bold text-text-primary">
            Fee Range (₦)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">Minimum</label>
              <Input
                type="number"
                value={feeMin}
                onChange={(e) => setFeeMin(e.target.value)}
                placeholder="50000"
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-text block mb-1">Maximum</label>
              <Input
                type="number"
                value={feeMax}
                onChange={(e) => setFeeMax(e.target.value)}
                placeholder="500000"
                className="h-[38px] rounded-lg border-border-custom text-[14px]"
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
              <GraduationCap className="size-4 text-brand" />
              Education
            </h3>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-dark"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>

          {education.map((edu, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_70px_32px] gap-2 items-end">
              <div>
                <label className="text-[11px] text-muted-text block mb-0.5">Institution</label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                  placeholder="University"
                  className="h-[34px] rounded-lg border-border-custom text-[13px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-text block mb-0.5">Degree</label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  placeholder="LL.B"
                  className="h-[34px] rounded-lg border-border-custom text-[13px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-text block mb-0.5">Year</label>
                <Input
                  type="number"
                  value={edu.year}
                  onChange={(e) => updateEducation(index, "year", parseInt(e.target.value) || 2000)}
                  className="h-[34px] rounded-lg border-border-custom text-[13px]"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="size-[34px] flex items-center justify-center rounded-full text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          {education.length === 0 && (
            <p className="text-[13px] text-muted-text">No education entries yet.</p>
          )}
        </div>

        {/* Availability */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="text-[15px] font-bold text-text-primary">Availability</h3>
          <div className="flex gap-2">
            {[
              { value: "accepting", label: "Accepting" },
              { value: "busy", label: "Busy" },
              { value: "on_break", label: "On Break" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value as typeof availability)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-bold transition-colors ${
                  availability === opt.value
                    ? "border-brand bg-brand text-white"
                    : "border-border-custom text-text-primary hover:bg-[#EFF3F4]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="px-4 py-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-[44px] rounded-full bg-brand text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              "Saved!"
            ) : (
              "Save"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
