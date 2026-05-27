import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function normalizeHandle(value: unknown) {
  if (typeof value !== "string") return null;
  const handle = value.toLowerCase().trim();
  return /^[a-z][a-z0-9_]{2,19}$/.test(handle) ? handle : null;
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 ? name : null;
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  if (!phone) return null;
  return /^[+0-9()\-\s]{7,24}$/.test(phone) ? phone : undefined;
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
    const fullName = normalizeName(body.full_name);
    const handle = normalizeHandle(body.handle);
    const phone = normalizePhone(body.phone);

    if (!fullName || !handle || phone === undefined) {
      return NextResponse.json(
        { error: "Invalid profile details" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const newHandleRef = adminDb.collection("handles").doc(handle);

    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists || userDoc.data()?.is_active === false) {
        throw new Error("USER_NOT_FOUND");
      }

      const currentHandle =
        typeof userDoc.data()?.handle === "string" ? userDoc.data()?.handle : "";

      if (currentHandle !== handle) {
        const handleDoc = await transaction.get(newHandleRef);
        if (handleDoc.exists && handleDoc.data()?.user_id !== uid) {
          throw new Error("HANDLE_TAKEN");
        }

        if (currentHandle) {
          transaction.delete(adminDb.collection("handles").doc(currentHandle));
        }

        transaction.set(newHandleRef, {
          user_id: uid,
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(userRef, {
        full_name: fullName,
        phone,
        handle,
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    await adminAuth.updateUser(uid, { displayName: fullName });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "HANDLE_TAKEN") {
      return NextResponse.json(
        { error: "This handle is already taken" },
        { status: 409 }
      );
    }

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Active account required" },
        { status: 403 }
      );
    }

    console.error("Settings profile update error:", error);
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 }
    );
  }
}
