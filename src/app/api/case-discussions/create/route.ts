import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getLawyerAccess } from "@/lib/server/lawyer-access";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

async function getSubscribedLawyerIds(excludeUid: string) {
  const profilesSnap = await adminDb
    .collection("lawyer_profiles")
    .where("subscription_tier", "in", ["professional", "elite"])
    .get();

  return profilesSnap.docs
    .filter((doc) => doc.id !== excludeUid)
    .filter((doc) => isPaidSubscriptionTier(doc.data().subscription_tier))
    .map((doc) => doc.id)
    .slice(0, 400);
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
    if (!access) {
      return NextResponse.json(
        { error: "Active lawyer account required" },
        { status: 403 }
      );
    }

    if (!access.isSubscribed) {
      return NextResponse.json(
        { error: "Subscription required to start a Case Circle" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const title = normalizeText(body.title, 140);
    const summary = normalizeText(body.summary, 1200);
    const practiceArea = normalizeText(body.practice_area, 80);
    const urgency = normalizeText(body.urgency, 40) || "normal";

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Title and case summary are required" },
        { status: 400 }
      );
    }

    const discussionRef = adminDb.collection("case_discussions").doc();
    const now = FieldValue.serverTimestamp();
    const memberIds = [access.uid];

    const batch = adminDb.batch();
    batch.set(discussionRef, {
      title,
      summary,
      practice_area: practiceArea,
      urgency,
      creator_id: access.uid,
      creator_name: access.user.full_name || "Lawyer",
      creator_slug: access.lawyerProfile.slug || null,
      member_ids: memberIds,
      participant_count: 1,
      status: "open",
      last_message_preview: summary.slice(0, 180),
      last_message_at: now,
      created_at: now,
      updated_at: now,
    });

    batch.set(discussionRef.collection("messages").doc(), {
      sender_id: access.uid,
      sender_name: access.user.full_name || "Lawyer",
      content: summary,
      message_type: "system",
      created_at: now,
    });

    const recipientIds = await getSubscribedLawyerIds(access.uid);
    recipientIds.forEach((userId) => {
      batch.set(adminDb.collection("notifications").doc(), {
        user_id: userId,
        type: "case_discussion_invite",
        title: "New Case Circle request",
        body: `${access.user.full_name || "A lawyer"} is requesting legal input: ${title}`,
        data: {
          discussion_id: discussionRef.id,
          href: `/dashboard/case-circles/${discussionRef.id}`,
        },
        is_read: false,
        created_at: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      status: "success",
      discussion_id: discussionRef.id,
      notified_count: recipientIds.length,
    });
  } catch (error) {
    console.error("Case Circle create error:", error);
    return NextResponse.json(
      { error: "Case Circle creation failed" },
      { status: 500 }
    );
  }
}
