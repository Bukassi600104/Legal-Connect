import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function safeCount(value: unknown) {
  const count = Number(value || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;
    const body = await request.json();
    const targetUserId =
      typeof body.target_user_id === "string" ? body.target_user_id : "";

    if (!targetUserId || targetUserId === uid) {
      return NextResponse.json(
        { error: "Invalid follow request" },
        { status: 400 }
      );
    }

    const followRef = adminDb.collection("follows").doc(`${uid}_${targetUserId}`);
    const actorRef = adminDb.collection("users").doc(uid);
    const targetRef = adminDb.collection("users").doc(targetUserId);
    const targetLawyerRef = adminDb
      .collection("lawyer_profiles")
      .doc(targetUserId);

    let active = false;
    let followerCount = 0;
    let followingCount = 0;

    await adminDb.runTransaction(async (transaction) => {
      const [followDoc, actorDoc, targetDoc, targetLawyerDoc] =
        await Promise.all([
          transaction.get(followRef),
          transaction.get(actorRef),
          transaction.get(targetRef),
          transaction.get(targetLawyerRef),
        ]);

      if (!actorDoc.exists || actorDoc.data()?.is_active === false) {
        throw new Error("ACTOR_NOT_FOUND");
      }

      if (!targetDoc.exists || targetDoc.data()?.is_active === false) {
        throw new Error("TARGET_NOT_FOUND");
      }

      const targetCurrentFollowers = safeCount(targetDoc.data()?.follower_count);
      const actorCurrentFollowing = safeCount(actorDoc.data()?.following_count);
      const targetLawyerFollowers = safeCount(
        targetLawyerDoc.data()?.follower_count
      );

      if (followDoc.exists) {
        active = false;
        followerCount = Math.max(0, targetCurrentFollowers - 1);
        followingCount = Math.max(0, actorCurrentFollowing - 1);

        transaction.delete(followRef);
      } else {
        active = true;
        followerCount = targetCurrentFollowers + 1;
        followingCount = actorCurrentFollowing + 1;

        transaction.set(followRef, {
          follower_id: uid,
          following_id: targetUserId,
          created_at: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(targetRef, {
        follower_count: followerCount,
        updated_at: FieldValue.serverTimestamp(),
      });
      transaction.update(actorRef, {
        following_count: followingCount,
        updated_at: FieldValue.serverTimestamp(),
      });

      if (targetLawyerDoc.exists) {
        transaction.update(targetLawyerRef, {
          follower_count: active
            ? targetLawyerFollowers + 1
            : Math.max(0, targetLawyerFollowers - 1),
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({
      status: "success",
      active,
      follower_count: followerCount,
      following_count: followingCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "ACTOR_NOT_FOUND") {
      return NextResponse.json(
        { error: "Active account required" },
        { status: 403 }
      );
    }

    if (message === "TARGET_NOT_FOUND") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.error("Follow toggle error:", error);
    return NextResponse.json(
      { error: "Follow update failed" },
      { status: 500 }
    );
  }
}
