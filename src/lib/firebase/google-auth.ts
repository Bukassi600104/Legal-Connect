"use client";

import {
  GoogleAuthProvider,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getDefaultAvatarUrl, getDefaultBannerUrl } from "@/lib/avatar-utils";
import { claimHandle, generateUniqueHandle } from "@/lib/handle-utils";
import type { AccountType, UserRole } from "@/types";

export const GOOGLE_ROLE_KEY = "legalconnect.googleRole";
export const GOOGLE_REDIRECT_KEY = "legalconnect.googleRedirectTo";
export const GOOGLE_PENDING_KEY = "legalconnect.googlePending";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function ensureGoogleUserProfile(user: User, role: UserRole) {
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (userDoc.exists()) return;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const handle = await generateUniqueHandle(displayName);
  await claimHandle(handle, user.uid);

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    full_name: displayName,
    handle,
    phone: user.phoneNumber || null,
    role,
    account_type: "individual" as AccountType,
    avatar_url: user.photoURL || getDefaultAvatarUrl(displayName),
    banner_url: getDefaultBannerUrl(displayName),
    bio: null,
    is_active: true,
    is_premium: false,
    follower_count: 0,
    following_count: 0,
    post_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function createSessionForUser(user: User) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to create session");
  }
}

export async function completeGoogleCredential(
  credential: UserCredential,
  role: UserRole
) {
  const user = credential.user;
  await ensureGoogleUserProfile(user, role);
  await createSessionForUser(user);
  return user;
}
