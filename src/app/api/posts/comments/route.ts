import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function requireSessionUid() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return null;
  }

  const decoded = await adminAuth.verifySessionCookie(session, true);
  return decoded.uid;
}

export async function POST(request: NextRequest) {
  try {
    const uid = await requireSessionUid();
    if (!uid) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const postId = typeof body.post_id === "string" ? body.post_id : "";
    const content =
      typeof body.content === "string" ? body.content.trim().slice(0, 1000) : "";

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Invalid comment request" },
        { status: 400 }
      );
    }

    const postRef = adminDb.collection("posts").doc(postId);
    const commentRef = adminDb.collection("post_comments").doc();
    let commentCount = 0;

    await adminDb.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error("POST_NOT_FOUND");
      }

      commentCount = Number(postDoc.data()?.comment_count || 0) + 1;
      transaction.set(commentRef, {
        post_id: postId,
        user_id: uid,
        content,
        like_count: 0,
        created_at: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, {
        comment_count: FieldValue.increment(1),
      });
    });

    return NextResponse.json({
      status: "success",
      comment_id: commentRef.id,
      comment_count: commentCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.error("Post comment create error:", error);
    return NextResponse.json(
      { error: "Comment creation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const uid = await requireSessionUid();
    if (!uid) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const commentId =
      typeof body.comment_id === "string" ? body.comment_id : "";

    if (!commentId) {
      return NextResponse.json(
        { error: "Missing comment id" },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const isAdmin =
      userDoc.exists &&
      userDoc.data()?.role === "admin" &&
      userDoc.data()?.is_active !== false;
    const commentRef = adminDb.collection("post_comments").doc(commentId);
    let commentCount = 0;

    await adminDb.runTransaction(async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists) {
        throw new Error("COMMENT_NOT_FOUND");
      }

      const comment = commentDoc.data()!;
      if (comment.user_id !== uid && !isAdmin) {
        throw new Error("COMMENT_FORBIDDEN");
      }

      const postRef = adminDb.collection("posts").doc(comment.post_id);
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error("POST_NOT_FOUND");
      }

      commentCount = Math.max(0, Number(postDoc.data()?.comment_count || 0) - 1);
      transaction.delete(commentRef);
      transaction.update(postRef, {
        comment_count: FieldValue.increment(-1),
      });
    });

    return NextResponse.json({
      status: "success",
      comment_count: commentCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "COMMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (message === "COMMENT_FORBIDDEN") {
      return NextResponse.json(
        { error: "Comment access denied" },
        { status: 403 }
      );
    }

    if (message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.error("Post comment delete error:", error);
    return NextResponse.json(
      { error: "Comment deletion failed" },
      { status: 500 }
    );
  }
}
