import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return trimmed.slice(0, 2048);
  } catch {
    return null;
  }
}

function normalizeScn(value: unknown) {
  if (typeof value !== "string") return null;
  const scn = value.trim().toUpperCase();
  return /^[A-Z0-9/.\- ]{3,40}$/.test(scn) ? scn : null;
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
    const scn = normalizeScn(body.scn);
    const certUrl = normalizeUrl(body.call_to_bar_cert_url);
    const feeUrl = normalizeUrl(body.practicing_fee_receipt_url);
    const idUrl = normalizeUrl(body.id_document_url);

    if (!scn || !certUrl || !feeUrl || !idUrl) {
      return NextResponse.json(
        { error: "Invalid verification request" },
        { status: 400 }
      );
    }

    const [userDoc, lawyerProfileDoc, pendingSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("lawyer_profiles").doc(uid).get(),
      adminDb
        .collection("verification_requests")
        .where("lawyer_id", "==", uid)
        .where("status", "==", "pending")
        .limit(1)
        .get(),
    ]);

    if (
      !userDoc.exists ||
      userDoc.data()?.role !== "lawyer" ||
      userDoc.data()?.is_active === false ||
      !lawyerProfileDoc.exists
    ) {
      return NextResponse.json(
        { error: "Active lawyer profile required" },
        { status: 403 }
      );
    }

    if (lawyerProfileDoc.data()?.verification_status === "verified") {
      return NextResponse.json(
        { error: "Profile is already verified" },
        { status: 409 }
      );
    }

    if (!pendingSnap.empty) {
      return NextResponse.json(
        { error: "A verification request is already pending" },
        { status: 409 }
      );
    }

    const requestRef = adminDb.collection("verification_requests").doc();
    const batch = adminDb.batch();

    batch.set(requestRef, {
      lawyer_id: uid,
      scn,
      call_to_bar_cert_url: certUrl,
      practicing_fee_receipt_url: feeUrl,
      id_document_url: idUrl,
      status: "pending",
      submitted_at: FieldValue.serverTimestamp(),
    });

    batch.update(adminDb.collection("lawyer_profiles").doc(uid), {
      scn,
      verification_status: "pending",
      updated_at: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      status: "success",
      request_id: requestRef.id,
    });
  } catch (error) {
    console.error("Verification request error:", error);
    return NextResponse.json(
      { error: "Verification request failed" },
      { status: 500 }
    );
  }
}
