"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/providers/auth-provider";

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkFollow() {
      if (!user || !targetUserId || user.uid === targetUserId) {
        setChecking(false);
        return;
      }

      try {
        const followId = `${user.uid}_${targetUserId}`;
        const followDoc = await getDoc(doc(db, "follows", followId));
        setIsFollowing(followDoc.exists());
      } catch (error) {
        console.error("Error checking follow:", error);
      } finally {
        setChecking(false);
      }
    }

    checkFollow();
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.uid === targetUserId || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Follow update failed");
      }

      setIsFollowing(Boolean(data.active));
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    toggleFollow,
    loading,
    checking,
  };
}
