import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

type InteractionType = "like" | "bookmark";

function normalizeInteraction(value: unknown): InteractionType | null {
  return value === "like" || value === "bookmark" ? value : null;
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
    const postId = typeof body.post_id === "string" ? body.post_id : "";
    const interaction = normalizeInteraction(body.interaction);

    if (!postId || !interaction) {
      return NextResponse.json(
        { error: "Invalid interaction request" },
        { status: 400 }
      );
    }

    const postRef = adminDb.collection("posts").doc(postId);
    const collectionName =
      interaction === "like" ? "post_likes" : "post_bookmarks";
    const interactionRef = adminDb
      .collection(collectionName)
      .doc(`${uid}_${postId}`);

    let active = false;
    let likeCount: number | null = null;

    await adminDb.runTransaction(async (transaction) => {
      const [postDoc, existingDoc] = await Promise.all([
        transaction.get(postRef),
        transaction.get(interactionRef),
      ]);

      if (!postDoc.exists) {
        throw new Error("POST_NOT_FOUND");
      }

      if (existingDoc.exists) {
        transaction.delete(interactionRef);
        active = false;

        if (interaction === "like") {
          const currentCount = Number(postDoc.data()?.like_count || 0);
          likeCount = Math.max(0, currentCount - 1);
          transaction.update(postRef, {
            like_count: FieldValue.increment(-1),
          });
        }
      } else {
        transaction.set(interactionRef, {
          post_id: postId,
          user_id: uid,
          created_at: FieldValue.serverTimestamp(),
        });
        active = true;

        if (interaction === "like") {
          const currentCount = Number(postDoc.data()?.like_count || 0);
          likeCount = currentCount + 1;
          transaction.update(postRef, {
            like_count: FieldValue.increment(1),
          });
        }
      }
    });

    return NextResponse.json({
      status: "success",
      active,
      ...(likeCount == null ? {} : { like_count: likeCount }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.error("Post interaction error:", error);
    return NextResponse.json(
      { error: "Post interaction failed" },
      { status: 500 }
    );
  }
}
