import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { isPaidSubscriptionTier } from "@/lib/feature-gate";

export type LawyerAccess = {
  uid: string;
  user: DocumentData;
  lawyerProfile: DocumentData;
  isSubscribed: boolean;
};

export async function getLawyerAccess(
  decoded: DecodedIdToken
): Promise<LawyerAccess | null> {
  const uid = decoded.uid;
  const [userDoc, lawyerDoc] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("lawyer_profiles").doc(uid).get(),
  ]);

  if (
    !userDoc.exists ||
    !lawyerDoc.exists ||
    userDoc.data()?.role !== "lawyer" ||
    userDoc.data()?.is_active === false
  ) {
    return null;
  }

  const user = userDoc.data()!;
  const lawyerProfile = lawyerDoc.data()!;
  const isSubscribed = isPaidSubscriptionTier(lawyerProfile.subscription_tier);

  return { uid, user, lawyerProfile, isSubscribed };
}
