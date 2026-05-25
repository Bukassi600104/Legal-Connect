import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function generateHandle(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15);
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return base + suffix;
}

export function validateHandle(handle: string): boolean {
  return /^[a-z][a-z0-9_]{2,19}$/.test(handle);
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "handles", handle));
  return !snap.exists();
}

export async function generateUniqueHandle(fullName: string): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const handle = generateHandle(fullName);
    if (validateHandle(handle) && (await isHandleAvailable(handle))) {
      return handle;
    }
    attempts++;
  }
  const fallback = "user" + Date.now().toString(36);
  return fallback;
}

export async function claimHandle(handle: string, userId: string): Promise<void> {
  await setDoc(doc(db, "handles", handle), { user_id: userId });
}
