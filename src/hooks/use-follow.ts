"use client";

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
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
    const followId = `${user.uid}_${targetUserId}`;
    const followRef = doc(db, "follows", followId);
    const targetProfileRef = doc(db, "lawyer_profiles", targetUserId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        // Decrement follower count
        try {
          await updateDoc(targetProfileRef, {
            follower_count: increment(-1),
          });
        } catch {
          // Profile may not exist
        }
        setIsFollowing(false);
      } else {
        await setDoc(followRef, {
          follower_id: user.uid,
          following_id: targetUserId,
          created_at: serverTimestamp(),
        });
        // Increment follower count
        try {
          await updateDoc(targetProfileRef, {
            follower_count: increment(1),
          });
        } catch {
          // Profile may not exist
        }
        setIsFollowing(true);
      }
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
