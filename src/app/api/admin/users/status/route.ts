import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/server/admin-guard";

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
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    const isActive = typeof body.is_active === "boolean" ? body.is_active : null;

    if (!userId || isActive == null) {
      return NextResponse.json(
        { error: "Invalid user status request" },
        { status: 400 }
      );
    }

    if (userId === admin.uid) {
      return NextResponse.json(
        { error: "Admins cannot suspend their own account" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userDoc.data()?.role === "admin") {
      return NextResponse.json(
        { error: "Admin users cannot be suspended here" },
        { status: 403 }
      );
    }

    await userRef.update({
      is_active: isActive,
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ status: "success", is_active: isActive });
  } catch (error) {
    console.error("Admin user status error:", error);
    return NextResponse.json(
      { error: "User status update failed" },
      { status: 500 }
    );
  }
}
