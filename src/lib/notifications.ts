import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { NotificationType } from "@/types";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  data,
}: CreateNotificationParams) {
  try {
    await addDoc(collection(db, "notifications"), {
      user_id: userId,
      type,
      title,
      body: body || null,
      data: data || null,
      is_read: false,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
