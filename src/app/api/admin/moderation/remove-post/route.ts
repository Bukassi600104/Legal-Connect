import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/server/admin-guard";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if ("error" in admin) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const postId = typeof body.post_id === "string" ? body.post_id : "";
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : "admin_moderation";

    if (!postId) {
      return NextResponse.json(
        { error: "Missing post id" },
        { status: 400 }
      );
    }

    const postRef = adminDb.collection("posts").doc(postId);

    await adminDb.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error("POST_NOT_FOUND");
      }

      transaction.set(adminDb.collection("moderation_actions").doc(), {
        action: "remove_post",
        post_id: postId,
        post_author_id: postDoc.data()?.author_id || null,
        reason,
        performed_by: admin.uid,
        performed_at: FieldValue.serverTimestamp(),
      });

      transaction.delete(postRef);
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    if (error instanceof Error && error.message === "POST_NOT_FOUND") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.error("Admin moderation remove post error:", error);
    return NextResponse.json(
      { error: "Post removal failed" },
      { status: 500 }
    );
  }
}
