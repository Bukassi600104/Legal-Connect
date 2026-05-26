"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile, deleteUser } from "firebase/auth";
import { db, auth } from "@/lib/firebase/config";
import { validateHandle, isHandleAvailable, claimHandle } from "@/lib/handle-utils";
import {
  LogOut,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { OptimizedAvatar } from "@/components/shared/optimized-image";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [handle, setHandle] = useState(profile?.handle || "");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (profile?.full_name && !fullName) setFullName(profile.full_name);
      if (profile?.phone && !phone) setPhone(profile.phone);
      if (profile?.handle && !handle) setHandle(profile.handle);
    });
  }, [fullName, handle, phone, profile]);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const cleanedHandle = handle.toLowerCase().trim();
      const handleChanged = cleanedHandle !== profile?.handle;

      // If handle changed, validate and claim
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
        // Release old handle, claim new
        if (profile?.handle) {
          try { await deleteDoc(doc(db, "handles", profile.handle)); } catch {}
        }
        await claimHandle(cleanedHandle, user.uid);
      }

      await updateDoc(doc(db, "users", user.uid), {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        ...(handleChanged && cleanedHandle ? { handle: cleanedHandle } : {}),
        updated_at: serverTimestamp(),
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: fullName.trim(),
        });
      }

      await refreshProfile();
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

      if (profile?.role === "lawyer") {
        try {
          await deleteDoc(doc(db, "lawyer_profiles", uid));
        } catch {}
      }

      try {
        await deleteDoc(doc(db, "users", uid));
      } catch {}

      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      try {
        await fetch("/api/auth/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
      } catch {}

      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch {}

      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      try {
        await fetch("/api/auth/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });
        await fetch("/api/auth/session", { method: "DELETE" });
        router.push("/");
      } catch {
        alert(
          "Failed to delete account. You may need to sign out and sign back in, then try again."
        );
      }
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
            <div className="flex items-center gap-4 mb-4">
              {profile?.avatar_url ? (
                <OptimizedAvatar
                  src={profile.avatar_url}
                  alt={profile.full_name}
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
              </div>
            </div>

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
