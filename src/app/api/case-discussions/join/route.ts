import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getLawyerAccess } from "@/lib/server/lawyer-access";

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
    if (!discussionId) {
      return NextResponse.json(
        { error: "Discussion id is required" },
        { status: 400 }
      );
    }

    const discussionRef = adminDb.collection("case_discussions").doc(discussionId);
    const result = await adminDb.runTransaction(async (transaction) => {
      const discussionDoc = await transaction.get(discussionRef);
      if (!discussionDoc.exists || discussionDoc.data()?.status !== "open") {
        return "missing";
      }

      const memberIds = discussionDoc.data()?.member_ids || [];
      if (Array.isArray(memberIds) && memberIds.includes(access.uid)) {
        return "already_joined";
      }

      transaction.update(discussionRef, {
        member_ids: FieldValue.arrayUnion(access.uid),
        participant_count: FieldValue.increment(1),
        updated_at: FieldValue.serverTimestamp(),
      });

      return "joined";
    });

    if (result === "missing") {
      return NextResponse.json(
        { error: "Case Circle is not available" },
        { status: 404 }
      );
    }

    if (result === "already_joined") {
      return NextResponse.json({ status: "success", already_joined: true });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Case Circle join error:", error);
    return NextResponse.json(
      { error: "Could not join Case Circle" },
      { status: 500 }
    );
  }
}
