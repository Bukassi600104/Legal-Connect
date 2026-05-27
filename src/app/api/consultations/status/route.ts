import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { ConsultationStatus } from "@/types";

const TARGET_STATUSES: ConsultationStatus[] = [
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function normalizeStatus(value: unknown): ConsultationStatus | null {
  return typeof value === "string" &&
    TARGET_STATUSES.includes(value as ConsultationStatus)
    ? (value as ConsultationStatus)
    : null;
}

function canTransition(
  currentStatus: ConsultationStatus,
  nextStatus: ConsultationStatus,
  actorRole: "client" | "lawyer"
) {
  if (currentStatus === "pending") {
    if (nextStatus === "confirmed") return actorRole === "lawyer";
    if (nextStatus === "cancelled") return true;
  }

  if (currentStatus === "confirmed") {
    if (nextStatus === "completed" || nextStatus === "no_show") {
      return actorRole === "lawyer";
    }
    if (nextStatus === "cancelled") return true;
  }

  return false;
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
    const nextStatus = normalizeStatus(body.status);

    if (!consultationId || !nextStatus) {
      return NextResponse.json(
        { error: "Invalid consultation status request" },
        { status: 400 }
      );
    }

    const consultationRef = adminDb
      .collection("consultations")
      .doc(consultationId);

    await adminDb.runTransaction(async (transaction) => {
      const consultationDoc = await transaction.get(consultationRef);
      if (!consultationDoc.exists) {
        throw new Error("CONSULTATION_NOT_FOUND");
      }

      const consultation = consultationDoc.data()!;
      const actorRole =
        consultation.client_id === uid
          ? "client"
          : consultation.lawyer_id === uid
            ? "lawyer"
            : null;

      if (!actorRole) {
        throw new Error("CONSULTATION_FORBIDDEN");
      }

      if (
        !canTransition(
          consultation.status as ConsultationStatus,
          nextStatus,
          actorRole
        )
      ) {
        throw new Error("CONSULTATION_INVALID_TRANSITION");
      }

      transaction.update(consultationRef, {
        status: nextStatus,
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

    if (message === "CONSULTATION_FORBIDDEN") {
      return NextResponse.json(
        { error: "Consultation access denied" },
        { status: 403 }
      );
    }

    if (message === "CONSULTATION_INVALID_TRANSITION") {
      return NextResponse.json(
        { error: "Consultation status transition is not allowed" },
        { status: 409 }
      );
    }

    console.error("Consultation status error:", error);
    return NextResponse.json(
      { error: "Consultation status update failed" },
      { status: 500 }
    );
  }
}
