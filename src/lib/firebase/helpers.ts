import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  serverTimestamp,
  increment,
  writeBatch,
  type WhereFilterOp,
} from "firebase/firestore";
import { db } from "./config";

// ============ COLLECTION REFERENCES ============

export const collections = {
  users: "users",
  lawyerProfiles: "lawyer_profiles",
  specializations: "specializations",
  posts: "posts",
  postLikes: "post_likes",
  postComments: "post_comments",
  postShares: "post_shares",
  postBookmarks: "post_bookmarks",
  follows: "follows",
  conversations: "conversations",
  messages: "messages",
  consultations: "consultations",
  lawyerAvailability: "lawyer_availability",
  reviews: "reviews",
  subscriptionPlans: "subscription_plans",
  subscriptions: "subscriptions",
  verificationRequests: "verification_requests",
  notifications: "notifications",
  corporateProfiles: "corporate_profiles",
  corporateMembers: "corporate_members",
} as const;

// ============ GENERIC HELPERS ============

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updated_at: serverTimestamp() }, { merge: true });
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updated_at: serverTimestamp() });
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

// ============ PAGINATION HELPER ============

export async function paginatedQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  pageSize: number,
  lastDoc?: DocumentData
): Promise<{ data: T[]; hasMore: boolean; lastDoc: DocumentData | null }> {
  const allConstraints = [...constraints, limit(pageSize + 1)];

  if (lastDoc) {
    allConstraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, collectionName), ...allConstraints);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;
  const results = docs.slice(0, pageSize);

  return {
    data: results.map((doc) => ({ id: doc.id, ...doc.data() } as T)),
    hasMore,
    lastDoc: results.length > 0 ? results[results.length - 1] : null,
  };
}

// ============ COUNTER HELPERS ============

export async function incrementField(
  collectionName: string,
  docId: string,
  field: string,
  value: number = 1
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { [field]: increment(value) });
}

// ============ BATCH OPERATIONS ============

export function createBatch() {
  return writeBatch(db);
}

export function getDocRef(collectionName: string, docId?: string): DocumentReference {
  if (docId) {
    return doc(db, collectionName, docId);
  }
  return doc(collection(db, collectionName));
}

// ============ COMPOSITE KEY HELPERS ============

// For like/bookmark/follow which use composite keys
export function compositeId(id1: string, id2: string): string {
  return `${id1}_${id2}`;
}

// Re-export commonly used Firestore functions
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  type WhereFilterOp,
};
