import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getLawyerAccess } from "@/lib/server/lawyer-access";

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = (await cookies()).get("session")?.value;
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const access = await getLawyerAccess(decoded);
    if (!access?.isSubscribed) {
      return NextResponse.json(
        { error: "Subscribed lawyer account required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const discussionId =
      typeof body.discussion_id === "string" ? body.discussion_id.trim() : "";
    const content = normalizeText(body.content, 4000);

    if (!discussionId || !content) {
      return NextResponse.json(
        { error: "Discussion id and message are required" },
        { status: 400 }
      );
    }

    const discussionRef = adminDb.collection("case_discussions").doc(discussionId);
    const discussionDoc = await discussionRef.get();
    const discussion = discussionDoc.data();

    if (
      !discussionDoc.exists ||
      discussion?.status !== "open" ||
      !Array.isArray(discussion.member_ids) ||
      !discussion.member_ids.includes(access.uid)
    ) {
      return NextResponse.json(
        { error: "Join this Case Circle before sending messages" },
        { status: 403 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const batch = adminDb.batch();

    batch.set(discussionRef.collection("messages").doc(), {
      sender_id: access.uid,
      sender_name: access.user.full_name || "Lawyer",
      content,
      message_type: "text",
      created_at: now,
    });

    batch.update(discussionRef, {
      last_message_preview: content.slice(0, 180),
      last_message_at: now,
      updated_at: now,
    });

    await batch.commit();

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Case Circle message error:", error);
    return NextResponse.json(
      { error: "Could not send Case Circle message" },
      { status: 500 }
    );
  }
}
