"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { generateUniqueHandle, claimHandle } from "@/lib/handle-utils";
import { getDefaultAvatarUrl, getDefaultBannerUrl } from "@/lib/avatar-utils";
import type { UserRole, AccountType } from "@/types";

const googleProvider = new GoogleAuthProvider();

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  accountType?: AccountType;
  phone?: string;
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
          scn: null,
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

  const signInWithGoogle = async (role: UserRole = "client") => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;

      // Check if user profile exists; if not, create one
      const { getDoc } = await import("firebase/firestore");
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        const displayName = user.displayName || "User";
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

      // Set session cookie
      const idToken = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      return user;
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
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
    resetPassword,
    loading,
    error,
    clearError,
  };
}

function getFirebaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
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
      default:
        return "An error occurred. Please try again.";
    }
  }
  return "An unexpected error occurred.";
}
