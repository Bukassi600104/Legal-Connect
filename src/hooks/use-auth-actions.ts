"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { claimHandle, generateUniqueHandle } from "@/lib/handle-utils";
import {
  GOOGLE_PENDING_KEY,
  GOOGLE_REDIRECT_KEY,
  GOOGLE_ROLE_KEY,
  completeGoogleCredential,
  googleProvider,
} from "@/lib/firebase/google-auth";
import { getDefaultAvatarUrl, getDefaultBannerUrl } from "@/lib/avatar-utils";
import type { UserRole, AccountType } from "@/types";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  accountType?: AccountType;
  phone?: string;
  scn?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const signUp = async (data: SignUpData) => {
    setLoading(true);
    setError(null);
    const scn = data.scn?.trim().toUpperCase();

    if (data.role === "lawyer" && !scn) {
      const message = "SCN is required for lawyer registration.";
      setError(message);
      setLoading(false);
      throw new Error(message);
    }

    try {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update display name
      await updateProfile(credential.user, {
        displayName: data.fullName,
      });

      // Generate unique handle and claim it
      const handle = await generateUniqueHandle(data.fullName);
      await claimHandle(handle, credential.user.uid);

      // Create user profile document in Firestore
      await setDoc(doc(db, "users", credential.user.uid), {
        email: data.email,
        full_name: data.fullName,
        handle,
        phone: data.phone || null,
        role: data.role,
        account_type: data.accountType || "individual",
        avatar_url: getDefaultAvatarUrl(data.fullName),
        banner_url: getDefaultBannerUrl(data.fullName),
        bio: null,
        is_active: true,
        is_premium: false,
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // If lawyer, create empty lawyer profile
      if (data.role === "lawyer") {
        const slug = data.fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await setDoc(doc(db, "lawyer_profiles", credential.user.uid), {
          user_id: credential.user.uid,
          slug: `${slug}-${credential.user.uid.slice(0, 6)}`,
          bio: null,
          cover_image_url: null,
          years_of_experience: null,
          scn,
          nba_branch: null,
          location_state: "",
          location_city: null,
          education: [],
          languages: ["English"],
          specialization_ids: [],
          fee_range_min: null,
          fee_range_max: null,
          availability_status: "accepting",
          verification_status: "unverified",
          follower_count: 0,
          post_count: 0,
          rating_avg: 0,
          rating_count: 0,
          subscription_tier: "free",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      // Set session cookie via API
      const idToken = await credential.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      return credential.user;
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Set session cookie
      const idToken = await credential.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      return credential.user;
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (
    role: UserRole = "client",
    redirectTo?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GOOGLE_PENDING_KEY, String(Date.now()));
        window.localStorage.setItem(GOOGLE_ROLE_KEY, role);
        window.localStorage.setItem(
          GOOGLE_REDIRECT_KEY,
          redirectTo || window.location.pathname + window.location.search
        );
      }

      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGooglePopup = async (role: UserRole = "client") => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return await completeGoogleCredential(credential, role);
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleRedirect = async (fallbackRole: UserRole = "client") => {
    setLoading(true);
    setError(null);
    try {
      const credential = await getRedirectResult(auth);
      if (!credential) return null;

      const storedRole =
        typeof window !== "undefined"
          ? window.localStorage.getItem(GOOGLE_ROLE_KEY)
          : null;
      const role = storedRole === "lawyer" ? "lawyer" : fallbackRole;
      const user = await completeGoogleCredential(credential, role);

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GOOGLE_PENDING_KEY);
        window.localStorage.removeItem(GOOGLE_ROLE_KEY);
      }

      return user;
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStoredGoogleRedirectTo = () => {
    if (typeof window === "undefined") return null;
    const redirectTo = window.localStorage.getItem(GOOGLE_REDIRECT_KEY);
    window.localStorage.removeItem(GOOGLE_REDIRECT_KEY);
    return redirectTo;
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGooglePopup,
    completeGoogleRedirect,
    getStoredGoogleRedirectTo,
    resetPassword,
    loading,
    error,
    clearError,
  };
}

function getFirebaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    console.error("[Auth Error]", code, err);
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed. Please try again.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for sign-in. Please contact support.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support.";
      case "auth/popup-blocked":
        return "Sign-in popup was blocked. Please allow popups and try again.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled. Please try again.";
      case "auth/internal-error":
        return "An internal error occurred. Please try again later.";
      default:
        console.error("[Auth Error] Unhandled code:", code);
        return `Authentication error (${code}). Please try again.`;
    }
  }
  console.error("[Auth Error] Non-Firebase error:", err);
  return "An unexpected error occurred. Please try again.";
}
