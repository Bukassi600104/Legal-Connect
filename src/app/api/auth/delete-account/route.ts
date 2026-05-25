import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Verify the current session first
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    let callerUid: string | null = null;

    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie);
        callerUid = decoded.uid;
      } catch {
        // Session invalid
      }
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Security: only allow users to delete their own account
    if (callerUid && callerUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete Firestore documents
    try {
      // Delete lawyer profile if exists
      await adminDb.doc(`lawyer_profiles/${uid}`).delete();
    } catch {}

    try {
      // Delete user profile
      await adminDb.doc(`users/${uid}`).delete();
    } catch {}

    // Delete user from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (error: unknown) {
      console.error("Error deleting auth user:", error);
    }

    // Clear session cookie
    cookieStore.delete("session");

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
