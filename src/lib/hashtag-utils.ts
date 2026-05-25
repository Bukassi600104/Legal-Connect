import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z][a-zA-Z0-9_]{1,30})/g);
  if (!matches) return [];
  const tags = matches.map((m) => m.slice(1).toLowerCase());
  return [...new Set(tags)];
}

export async function updateHashtagCounts(hashtags: string[]): Promise<void> {
  for (const tag of hashtags) {
    const tagRef = doc(db, "hashtag_counts", tag);
    try {
      const snap = await getDoc(tagRef);
      if (snap.exists()) {
        await updateDoc(tagRef, {
          count: increment(1),
          last_used_at: new Date(),
        });
      } else {
        await setDoc(tagRef, {
          tag,
          count: 1,
          last_used_at: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error updating hashtag count for #${tag}:`, error);
    }
  }
}
