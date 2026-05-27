import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { ConsultationType } from "@/types";

const CONSULTATION_TYPES: ConsultationType[] = ["video", "phone", "in_person"];
const DURATIONS = [30, 60, 90, 120];

function normalizeConsultationType(value: unknown): ConsultationType | null {
  return typeof value === "string" &&
    CONSULTATION_TYPES.includes(value as ConsultationType)
    ? (value as ConsultationType)
    : null;
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
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
    const lawyerId = typeof body.lawyer_id === "string" ? body.lawyer_id : "";
    const consultationType = normalizeConsultationType(body.consultation_type);
    const duration = Number(body.duration_minutes);
    const scheduledAt =
      typeof body.scheduled_at === "string" ? new Date(body.scheduled_at) : null;
    const topic = normalizeText(body.topic, 160);
    const notes = normalizeText(body.notes, 1000);

    if (
      !lawyerId ||
      lawyerId === uid ||
      !consultationType ||
      !DURATIONS.includes(duration) ||
      !scheduledAt ||
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "Invalid consultation request" },
        { status: 400 }
      );
    }

    const [clientDoc, lawyerDoc, lawyerProfileDoc] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("users").doc(lawyerId).get(),
      adminDb.collection("lawyer_profiles").doc(lawyerId).get(),
    ]);

    if (
      !clientDoc.exists ||
      clientDoc.data()?.role !== "client" ||
      clientDoc.data()?.is_active === false
    ) {
      return NextResponse.json(
        { error: "Active client account required" },
        { status: 403 }
      );
    }

    if (
      !lawyerDoc.exists ||
      lawyerDoc.data()?.role !== "lawyer" ||
      lawyerDoc.data()?.is_active === false ||
      !lawyerProfileDoc.exists
    ) {
      return NextResponse.json(
        { error: "Lawyer is not available for booking" },
        { status: 404 }
      );
    }

    const lawyerProfile = lawyerProfileDoc.data()!;
    if (lawyerProfile.availability_status === "unavailable") {
      return NextResponse.json(
        { error: "Lawyer is not accepting consultations" },
        { status: 409 }
      );
    }

    let conversationId: string | null = null;
    const conversationSnap = await adminDb
      .collection("conversations")
      .where("participants", "array-contains", uid)
      .limit(25)
      .get();
    const existingConversation = conversationSnap.docs.find((doc) =>
      doc.data().participants?.includes(lawyerId)
    );
    if (existingConversation) {
      conversationId = existingConversation.id;
    }

    const consultationRef = adminDb.collection("consultations").doc();
    await consultationRef.set({
      lawyer_id: lawyerId,
      client_id: uid,
      conversation_id: conversationId,
      consultation_type: consultationType,
      scheduled_at: Timestamp.fromDate(scheduledAt),
      duration_minutes: duration,
      status: "pending",
      topic,
      notes,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      status: "success",
      consultation_id: consultationRef.id,
    });
  } catch (error) {
    console.error("Consultation booking error:", error);
    return NextResponse.json(
      { error: "Consultation booking failed" },
      { status: 500 }
    );
  }
}
