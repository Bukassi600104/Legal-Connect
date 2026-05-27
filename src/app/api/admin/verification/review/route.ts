import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/server/admin-guard";

type Decision = "approved" | "rejected";

function normalizeDecision(value: unknown): Decision | null {
  return value === "approved" || value === "rejected" ? value : null;
}

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
    const requestId =
      typeof body.request_id === "string" ? body.request_id : "";
    const decision = normalizeDecision(body.decision);
    const reviewNotes =
      typeof body.review_notes === "string" && body.review_notes.trim()
        ? body.review_notes.trim().slice(0, 1000)
        : null;

    if (!requestId || !decision) {
      return NextResponse.json(
        { error: "Invalid verification review request" },
        { status: 400 }
      );
    }

    const requestRef = adminDb.collection("verification_requests").doc(requestId);

    await adminDb.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      const data = requestDoc.data()!;
      if (data.status !== "pending") {
        throw new Error("REQUEST_ALREADY_REVIEWED");
      }

      const lawyerId = data.lawyer_id;
      if (typeof lawyerId !== "string" || !lawyerId) {
        throw new Error("INVALID_LAWYER");
      }

      const lawyerProfileRef = adminDb
        .collection("lawyer_profiles")
        .doc(lawyerId);
      const lawyerProfileDoc = await transaction.get(lawyerProfileRef);
      if (!lawyerProfileDoc.exists) {
        throw new Error("LAWYER_PROFILE_NOT_FOUND");
      }

      const verificationStatus =
        decision === "approved" ? "verified" : "rejected";

      transaction.update(requestRef, {
        status: decision,
        reviewed_by: admin.uid,
        review_notes: reviewNotes,
        reviewed_at: FieldValue.serverTimestamp(),
      });

      transaction.update(lawyerProfileRef, {
        verification_status: verificationStatus,
        verification_date: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { error: "Verification request not found" },
        { status: 404 }
      );
    }

    if (message === "REQUEST_ALREADY_REVIEWED") {
      return NextResponse.json(
        { error: "Verification request has already been reviewed" },
        { status: 409 }
      );
    }

    if (message === "LAWYER_PROFILE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Lawyer profile not found" },
        { status: 404 }
      );
    }

    if (message === "INVALID_LAWYER") {
      return NextResponse.json(
        { error: "Verification request is missing a lawyer" },
        { status: 400 }
      );
    }

    console.error("Admin verification review error:", error);
    return NextResponse.json(
      { error: "Verification review failed" },
      { status: 500 }
    );
  }
}
