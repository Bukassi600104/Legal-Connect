import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getPremiumLimits } from "@/lib/feature-gate";
import type { PostCategory } from "@/types";

const POST_CATEGORIES: PostCategory[] = [
  "legal_tip",
  "case_study",
  "know_your_rights",
  "opinion",
  "legal_news",
  "general",
];

type IncomingPost = {
  content?: unknown;
  category?: unknown;
};

function extractHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z][a-zA-Z0-9_]{1,30})/g);
  if (!matches) return [];
  return [...new Set(matches.map((match) => match.slice(1).toLowerCase()))];
}

function normalizeCategory(category: unknown): PostCategory {
  if (
    typeof category === "string" &&
    POST_CATEGORIES.includes(category as PostCategory)
  ) {
    return category as PostCategory;
  }

  return "general";
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
    const rawPosts: IncomingPost[] = Array.isArray(body.posts)
      ? body.posts
      : [{ content: body.content, category: body.category }];

    if (rawPosts.length < 1 || rawPosts.length > 10) {
      return NextResponse.json(
        { error: "Invalid post count" },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.is_active === false) {
      return NextResponse.json(
        { error: "Active account required" },
        { status: 403 }
      );
    }

    const userData = userDoc.data()!;
    const limits = getPremiumLimits(Boolean(userData.is_premium));

    if (rawPosts.length > 1 && !limits.canCreateThreads) {
      return NextResponse.json(
        { error: "Upgrade required to create threads" },
        { status: 403 }
      );
    }

    const posts = rawPosts.map((post) => {
      const content = typeof post.content === "string" ? post.content.trim() : "";

      if (!content || content.length > limits.charLimit) {
        throw new Error("INVALID_POST_CONTENT");
      }

      return {
        content,
        category: normalizeCategory(post.category),
        hashtags: extractHashtags(content),
      };
    });

    const batch = adminDb.batch();
    const postIds: string[] = [];
    const threadId = posts.length > 1 ? adminDb.collection("posts").doc().id : null;

    posts.forEach((post, index) => {
      const postRef = adminDb.collection("posts").doc();
      postIds.push(postRef.id);
      batch.set(postRef, {
        author_id: uid,
        content: post.content,
        category: post.category,
        media_urls: [],
        hashtags: post.hashtags,
        is_pinned: false,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
        is_boosted: false,
        ...(threadId
          ? {
              thread_id: threadId,
              thread_position: index,
              is_thread_starter: index === 0,
            }
          : {}),
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    const uniqueTags = [...new Set(posts.flatMap((post) => post.hashtags))];
    uniqueTags.forEach((tag) => {
      batch.set(
        adminDb.collection("hashtag_counts").doc(tag),
        {
          tag,
          count: FieldValue.increment(1),
          last_used_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    batch.update(adminDb.collection("users").doc(uid), {
      post_count: FieldValue.increment(posts.length),
      updated_at: FieldValue.serverTimestamp(),
    });

    const lawyerDoc = await adminDb.collection("lawyer_profiles").doc(uid).get();
    if (lawyerDoc.exists) {
      batch.update(adminDb.collection("lawyer_profiles").doc(uid), {
        post_count: FieldValue.increment(posts.length),
        updated_at: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({ status: "success", postIds });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_POST_CONTENT") {
      return NextResponse.json(
        { error: "Post content is empty or too long" },
        { status: 400 }
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Post creation failed" },
      { status: 500 }
    );
  }
}
