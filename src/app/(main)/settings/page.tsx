"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { validateHandle, isHandleAvailable } from "@/lib/handle-utils";
import {
  LogOut,
  Loader2,
  Check,
  X,
  Camera,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  OptimizedAvatar,
  OptimizedFillImage,
} from "@/components/shared/optimized-image";
import { storage } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image file"));
    };
    image.src = url;
  });
}

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [handle, setHandle] = useState(profile?.handle || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (profile?.full_name && !fullName) setFullName(profile.full_name);
      if (profile?.phone && !phone) setPhone(profile.phone);
      if (profile?.bio && !bio) setBio(profile.bio);
      if (profile?.handle && !handle) setHandle(profile.handle);
      if (profile?.avatar_url && !avatarUrl) setAvatarUrl(profile.avatar_url);
      if (profile?.banner_url && !bannerUrl) setBannerUrl(profile.banner_url);
    });
  }, [avatarUrl, bannerUrl, bio, fullName, handle, phone, profile]);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function checkHandle(value: string) {
    const cleaned = value.toLowerCase().trim();
    if (!cleaned || cleaned === profile?.handle) {
      setHandleStatus("idle");
      return;
    }
    if (!validateHandle(cleaned)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    const available = await isHandleAvailable(cleaned);
    setHandleStatus(available ? "available" : "taken");
  }

  async function handleAvatarSelect(file: File | undefined) {
    setMediaError(null);
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      setMediaError("Profile image must be an image under 3MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleBannerSelect(file: File | undefined) {
    setMediaError(null);
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) {
      setMediaError("Banner image must be an image under 6MB.");
      return;
    }

    try {
      const { width, height } = await getImageDimensions(file);
      const ratio = width / height;
      if (width < 1200 || height < 400 || ratio < 2.7 || ratio > 3.3) {
        setMediaError(
          "Banner must be at least 1200x400px and close to a 3:1 ratio, for example 1500x500px."
        );
        return;
      }

      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    } catch {
      setMediaError("Could not read that banner image.");
    }
  }

  async function uploadProfileMedia(file: File, kind: "avatar" | "banner") {
    if (!user) throw new Error("Authentication required");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storageRef = ref(
      storage,
      `profile-media/${user.uid}/${kind}_${Date.now()}.${extension}`
    );
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const cleanedHandle = handle.toLowerCase().trim();
      const handleChanged = cleanedHandle !== profile?.handle;

      if (handleChanged && cleanedHandle) {
        if (!validateHandle(cleanedHandle)) {
          setHandleStatus("invalid");
          setSaving(false);
          return;
        }
        const available = await isHandleAvailable(cleanedHandle);
        if (!available) {
          setHandleStatus("taken");
          setSaving(false);
          return;
        }
      }

      const nextAvatarUrl = avatarFile
        ? await uploadProfileMedia(avatarFile, "avatar")
        : avatarUrl || null;
      const nextBannerUrl = bannerFile
        ? await uploadProfileMedia(bannerFile, "banner")
        : bannerUrl || null;

      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          handle: cleanedHandle || profile?.handle,
          bio,
          avatar_url: nextAvatarUrl,
          banner_url: nextBannerUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) setHandleStatus("taken");
        throw new Error(data.error || "Profile update failed");
      }

      await refreshProfile();
      setAvatarUrl(nextAvatarUrl || "");
      setBannerUrl(nextBannerUrl || "");
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview("");
      setBannerPreview("");
      setHandleStatus("idle");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    router.push("/");
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirmText !== "DELETE" || deleting) return;

    setDeleting(true);
    try {
      const uid = user.uid;

      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }

      await signOut();

      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(
        "Failed to delete account. You may need to sign out and sign back in, then try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center">
        <h1 className="text-xl font-extrabold text-text-primary">Settings</h1>
      </div>

      <div className="divide-y divide-border-custom">
        {/* Profile section */}
        <div className="p-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[15px] font-medium text-text-primary block mb-2">
                Banner image
              </label>
              <div className="relative h-36 overflow-hidden rounded-lg border border-border-custom bg-brand/10">
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : bannerUrl ? (
                  <OptimizedFillImage
                    src={bannerUrl}
                    alt="Profile banner"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] font-semibold text-muted-text">
                    Recommended size: 1500x500px
                  </div>
                )}
                <label className="absolute bottom-3 right-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 text-[13px] font-bold text-text-primary shadow-sm hover:bg-[#F8FAFC]">
                  <Camera className="size-4" />
                  Change banner
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleBannerSelect(e.target.files?.[0])}
                  />
                </label>
              </div>
              <p className="mt-1 text-[12px] text-muted-text">
                Upload at least 1200x400px, close to a 3:1 ratio.
              </p>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="size-16 rounded-full object-cover"
                />
              ) : avatarUrl ? (
                <OptimizedAvatar
                  src={avatarUrl}
                  alt={profile?.full_name || "Profile image"}
                  className="size-16"
                  sizes="64px"
                />
              ) : (
                <div className="size-16 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div>
                <p className="text-[17px] font-extrabold text-text-primary">
                  {profile?.full_name}
                </p>
                {profile?.handle && (
                  <p className="text-[15px] text-muted-text">@{profile.handle}</p>
                )}
                <p className="text-[13px] text-muted-text capitalize">
                  {profile?.role} account
                </p>
                <label className="mt-2 inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border-custom px-3 text-[13px] font-bold text-text-primary hover:bg-[#F8FAFC]">
                  <Camera className="size-4" />
                  Change profile image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleAvatarSelect(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {mediaError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-[13px] font-semibold text-error">
                {mediaError}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="text-[15px] font-medium text-text-primary block mb-1">
                Name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[42px] rounded-md border border-border-custom bg-transparent px-3 text-[15px] text-text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="handle" className="text-[15px] font-medium text-text-primary block mb-1">
                Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted-text">@</span>
                <input
                  id="handle"
                  value={handle}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setHandle(val);
                    checkHandle(val);
                  }}
                  className="w-full h-[42px] rounded-md border border-border-custom bg-transparent pl-8 pr-10 text-[15px] text-text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  placeholder="yourhandle"
                  maxLength={20}
                />
                {handleStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-text animate-spin" />
                )}
                {handleStatus === "available" && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#00BA7C]" />
                )}
                {(handleStatus === "taken" || handleStatus === "invalid") && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#F4212E]" />
                )}
              </div>
              {handleStatus === "taken" && (
                <p className="mt-1 text-[13px] text-[#F4212E]">This handle is already taken.</p>
              )}
              {handleStatus === "invalid" && (
                <p className="mt-1 text-[13px] text-[#F4212E]">3-20 chars, letters, numbers, underscores only. Must start with a letter.</p>
              )}
              {handleStatus === "available" && (
                <p className="mt-1 text-[13px] text-[#00BA7C]">Handle is available!</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="text-[15px] font-medium text-text-primary block mb-1">
                Email
              </label>
              <input
                id="email"
                value={profile?.email || ""}
                disabled
                className="w-full h-[42px] rounded-md border border-border-custom bg-[#F7F9F9] px-3 text-[15px] text-muted-text outline-none"
              />
              <p className="mt-1 text-[13px] text-muted-text">
                Email cannot be changed here for security reasons.
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="text-[15px] font-medium text-text-primary block mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself or your practice"
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-md border border-border-custom bg-transparent px-3 py-2 text-[15px] text-text-primary placeholder:text-muted-text outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-[13px] text-muted-text">
                {bio.length}/500
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="text-[15px] font-medium text-text-primary block mb-1">
                Phone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full h-[42px] rounded-md border border-border-custom bg-transparent px-3 text-[15px] text-text-primary placeholder:text-muted-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                "Saved!"
              ) : (
                "Save"
              )}
            </button>
          </form>
        </div>

        {/* Account actions */}
        <div className="p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full py-3 text-[15px] text-text-primary hover:bg-black/[0.03] rounded-md px-2 transition-colors"
          >
            <LogOut className="size-5 text-muted-text" />
            Log out
          </button>
        </div>

        {/* Danger zone */}
        <div className="p-4">
          <h2 className="text-[15px] font-bold text-[#F4212E] mb-2">
            Danger zone
          </h2>
          <p className="text-[13px] text-muted-text mb-4">
            Permanently delete your account and all data. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              className="inline-flex h-9 items-center rounded-full border border-[#F4212E]/30 px-5 text-[15px] font-bold text-[#F4212E] hover:bg-[#F4212E]/5 transition-colors"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-[#F4212E]/20 p-4">
              <p className="text-[15px] font-bold text-[#F4212E]">
                Are you absolutely sure?
              </p>
              <p className="text-[13px] text-muted-text">
                Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full h-[42px] rounded-md border border-[#F4212E]/20 bg-transparent px-3 text-[15px] text-text-primary outline-none focus:border-[#F4212E] focus:ring-1 focus:ring-[#F4212E] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  className="inline-flex h-9 items-center rounded-full border border-border-custom px-4 text-[15px] font-bold text-text-primary hover:bg-[#E7E9EA] transition-colors"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="inline-flex h-9 items-center rounded-full bg-[#F4212E] px-4 text-[15px] font-bold text-white hover:bg-[#F4212E]/90 disabled:opacity-50 transition-colors"
                  onClick={handleDeleteAccount}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete forever"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
