"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithCustomToken,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { UserProfile, LawyerProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  lawyerProfile: LawyerProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  lawyerProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const sessionRecoveryAttempted = useRef(false);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        setProfile(null);
        setLawyerProfile(null);
        return;
      }

      const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
      setProfile(userProfile);

      if (userProfile.role === "lawyer") {
        const lawyerDoc = await getDoc(doc(db, "lawyer_profiles", uid));
        if (lawyerDoc.exists()) {
          setLawyerProfile({
            id: lawyerDoc.id,
            ...lawyerDoc.data(),
          } as LawyerProfile);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setLawyerProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  // Try to recover auth from server session when client-side auth is null
  const recoverFromSession = useCallback(async () => {
    if (sessionRecoveryAttempted.current) return false;
    sessionRecoveryAttempted.current = true;

    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) return false;

      const data = await res.json();
      if (!data.user || !data.customToken) return false;

      // Re-authenticate client-side with custom token
      const userCredential = await signInWithCustomToken(
        auth,
        data.customToken
      );
      // onAuthStateChanged will handle setting state
      return true;
    } catch (error) {
      console.error("Session recovery failed:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.uid);
        setLoading(false);
      } else {
        // Client-side auth is null — try to recover from server session
        const recovered = await recoverFromSession();
        if (!recovered) {
          // No valid session either
          setUser(null);
          setProfile(null);
          setLawyerProfile(null);
          setLoading(false);
        }
        // If recovered, onAuthStateChanged will fire again with the user
      }
    });

    return () => unsubscribe();
  }, [fetchProfile, recoverFromSession]);

  const signOut = async () => {
    try {
      // Clear server-side session cookie
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setLawyerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, lawyerProfile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
