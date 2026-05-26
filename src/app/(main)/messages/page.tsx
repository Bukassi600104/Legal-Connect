"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Search, Settings, MailPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

interface ConversationWithUser extends Conversation {
  other_user?: UserProfile;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("last_message_at", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Conversation)
      );

      const hydrated: ConversationWithUser[] = await Promise.all(
        convos.map(async (convo) => {
          const otherUserId = convo.participants?.find((p) => p !== user.uid) ?? "";

          let otherUser: UserProfile | undefined;

          if (convo.participant_names?.[otherUserId]) {
            otherUser = {
              id: otherUserId,
              full_name: convo.participant_names[otherUserId],
              avatar_url: convo.participant_avatars?.[otherUserId] || "",
              email: "",
              role: "client",
              is_active: true,
              created_at: convo.created_at,
            } as UserProfile;
          } else if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, "users", otherUserId));
              if (userDoc.exists()) {
                otherUser = { id: userDoc.id, ...userDoc.data() } as UserProfile;
              }
            } catch {
              // ignore
            }
          }

          const preview = convo.last_message_preview || convo.last_message || "";
          return { ...convo, other_user: otherUser, last_message_preview: preview };
        })
      );

      setConversations(hydrated);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.other_user?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : conversations;

  if (authLoading || (user && loading)) return <PageLoader />;

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <h1 className="text-xl font-extrabold text-text-primary">Messages</h1>
          <div className="flex items-center gap-1">
            <button className="inline-flex items-center justify-center size-9 rounded-full hover:bg-[#E7E9EA] transition-colors text-text-primary">
              <Settings className="size-5" />
            </button>
            <button className="inline-flex items-center justify-center size-9 rounded-full hover:bg-[#E7E9EA] transition-colors text-text-primary">
              <MailPlus className="size-5" />
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-text" />
            <Input
              type="search"
              placeholder="Search Direct Messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[42px] rounded-full border-0 bg-[#EFF3F4] pl-11 text-[15px] placeholder:text-muted-text focus-visible:ring-1 focus-visible:ring-brand focus-visible:bg-white focus-visible:border focus-visible:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <h2 className="text-[31px] font-extrabold text-text-primary">
              Welcome to your inbox!
            </h2>
            <p className="mt-2 text-[15px] text-muted-text max-w-sm mx-auto">
              Drop a line, share posts and more with private conversations between you and others on LegalConnect.
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((convo) => {
              const lastAt = convo.last_message_at
                ? typeof convo.last_message_at === "string"
                  ? new Date(convo.last_message_at)
                  : convo.last_message_at?.toDate?.() ?? new Date()
                : new Date();

              return (
                <Link
                  key={convo.id}
                  href={`/messages/${convo.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03]"
                >
                  <div className="size-12 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                    {convo.other_user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[15px] font-bold text-text-primary truncate">
                        {convo.other_user?.full_name || "User"}
                      </span>
                      <span className="text-[15px] text-muted-text shrink-0">
                        &middot; {formatDistanceToNow(lastAt, { addSuffix: false })}
                      </span>
                    </div>
                    {convo.last_message_preview && (
                      <p className="mt-0.5 text-[15px] text-muted-text truncate">
                        {convo.last_message_preview}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
