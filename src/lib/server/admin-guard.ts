import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return { error: "Authentication required" as const, status: 401 as const };
  }

  const decoded = await adminAuth.verifySessionCookie(session, true);
  const adminDoc = await adminDb.collection("users").doc(decoded.uid).get();

  if (
    !adminDoc.exists ||
    adminDoc.data()?.role !== "admin" ||
    adminDoc.data()?.is_active === false
  ) {
    return { error: "Admin access required" as const, status: 403 as const };
  }

  return { uid: decoded.uid };
}
