import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function normalizeRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > 5) return null;
  return value;
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
    const consultationId =
      typeof body.consultation_id === "string" ? body.consultation_id : "";
    const rating = normalizeRating(body.rating);
    const content =
      typeof body.content === "string" && body.content.trim()
        ? body.content.trim().slice(0, 1000)
        : null;

    if (!consultationId || rating == null) {
      return NextResponse.json(
        { error: "Invalid review request" },
        { status: 400 }
      );
    }

    const consultationRef = adminDb
      .collection("consultations")
      .doc(consultationId);
    const reviewRef = adminDb
      .collection("reviews")
      .doc(`${consultationId}_${uid}`);

    await adminDb.runTransaction(async (transaction) => {
      const [consultationDoc, existingReviewDoc] = await Promise.all([
        transaction.get(consultationRef),
        transaction.get(reviewRef),
      ]);

      if (existingReviewDoc.exists) {
        throw new Error("REVIEW_ALREADY_SUBMITTED");
      }

      if (!consultationDoc.exists) {
        throw new Error("CONSULTATION_NOT_FOUND");
      }

      const consultation = consultationDoc.data()!;
      if (
        consultation.client_id !== uid ||
        consultation.status !== "completed"
      ) {
        throw new Error("CONSULTATION_NOT_REVIEWABLE");
      }

      const lawyerId = consultation.lawyer_id;
      const lawyerProfileRef = adminDb
        .collection("lawyer_profiles")
        .doc(lawyerId);
      const lawyerProfileDoc = await transaction.get(lawyerProfileRef);

      if (!lawyerProfileDoc.exists) {
        throw new Error("LAWYER_PROFILE_NOT_FOUND");
      }

      const profile = lawyerProfileDoc.data()!;
      const currentCount = Number(profile.rating_count || 0);
      const currentAvg = Number(profile.rating_avg || 0);
      const newCount = currentCount + 1;
      const newAvg =
        Math.round(((currentAvg * currentCount + rating) / newCount) * 10) /
        10;

      transaction.set(reviewRef, {
        lawyer_id: lawyerId,
        client_id: uid,
        consultation_id: consultationId,
        rating,
        content,
        created_at: FieldValue.serverTimestamp(),
      });

      transaction.update(lawyerProfileRef, {
        rating_count: newCount,
        rating_avg: newAvg,
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "CONSULTATION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    if (message === "REVIEW_ALREADY_SUBMITTED") {
      return NextResponse.json(
        { error: "Review already submitted" },
        { status: 409 }
      );
    }

    if (message === "CONSULTATION_NOT_REVIEWABLE") {
      return NextResponse.json(
        { error: "This consultation cannot be reviewed" },
        { status: 403 }
      );
    }

    if (message === "LAWYER_PROFILE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Lawyer profile not found" },
        { status: 404 }
      );
    }

    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Review submission failed" },
      { status: 500 }
    );
  }
}
