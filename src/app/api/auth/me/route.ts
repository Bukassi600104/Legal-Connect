import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const uid = decodedClaims.uid;

    // Fetch user profile from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userData = userDoc.data()!;

    // Fetch lawyer profile if applicable
    let lawyerProfile = null;
    if (userData.role === "lawyer") {
      const lawyerDoc = await adminDb
        .collection("lawyer_profiles")
        .doc(uid)
        .get();
      if (lawyerDoc.exists) {
        lawyerProfile = { id: lawyerDoc.id, ...lawyerDoc.data() };
      }
    }

    // Create a custom token for client-side re-authentication
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({
      user: {
        uid,
        email: decodedClaims.email,
      },
      profile: { id: userDoc.id, ...userData },
      lawyerProfile,
      customToken,
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
