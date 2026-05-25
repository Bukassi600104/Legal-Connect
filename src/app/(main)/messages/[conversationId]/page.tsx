"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Send, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Conversation, Message, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { user, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !conversationId) {
      setLoading(false);
      return;
    }

    async function fetchConvo() {
      const convoDoc = await getDoc(doc(db, "conversations", conversationId));
      if (!convoDoc.exists()) {
        router.push("/messages");
        return;
      }

      const convoData = {
        id: convoDoc.id,
        ...convoDoc.data(),
      } as Conversation;
      setConversation(convoData);

      const otherUserId = convoData.participants?.find((p) => p !== user!.uid) ?? "";

      if (convoData.participant_names?.[otherUserId]) {
        setOtherUser({
          id: otherUserId,
          full_name: convoData.participant_names[otherUserId],
          avatar_url: convoData.participant_avatars?.[otherUserId] || "",
          email: "",
          role: "client",
          is_active: true,
          created_at: convoData.created_at,
        } as UserProfile);
      } else if (otherUserId) {
        try {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            setOtherUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
          }
        } catch {
          // ignore
        }
      }
    }

    fetchConvo();
  }, [user, authLoading, conversationId, router]);

  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Message)
      );
      setMessages(msgs);
      setLoading(false);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !conversationId || sending) return;

    setSending(true);
    const text = messageText.trim();
    setMessageText("");

    try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        sender_id: user.uid,
        sender_name: user.displayName || "User",
        content: text,
        message_type: "text",
        read: false,
        created_at: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversations", conversationId), {
        last_message_at: serverTimestamp(),
        last_message_preview: text.slice(0, 100),
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col h-screen">
      {/* X-style chat header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-custom bg-white/85 backdrop-blur-md px-4 h-[53px]">
        <Link
          href="/messages"
          className="inline-flex items-center justify-center size-9 rounded-full hover:bg-[#E7E9EA] transition-colors"
        >
          <ArrowLeft className="size-5 text-text-primary" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-extrabold text-text-primary truncate">
            {otherUser?.full_name || "User"}
          </p>
        </div>
        <button className="inline-flex items-center justify-center size-9 rounded-full hover:bg-[#E7E9EA] transition-colors text-text-primary">
          <Info className="size-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="size-16 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl mx-auto mb-4">
              {otherUser?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <h3 className="text-xl font-extrabold text-text-primary">
              {otherUser?.full_name || "User"}
            </h3>
            <p className="text-[15px] text-muted-text mt-1">
              Start of your conversation
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.uid;
          const createdAt = msg.created_at
            ? typeof msg.created_at === "string"
              ? new Date(msg.created_at)
              : msg.created_at?.toDate?.() ?? new Date()
            : new Date();

          return (
            <div
              key={msg.id}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-[20px] px-4 py-2.5",
                  isOwn
                    ? "bg-brand text-white"
                    : "bg-[#EFF3F4] text-text-primary"
                )}
              >
                <p className="text-[15px] leading-[20px] whitespace-pre-wrap">
                  {msg.content}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    isOwn ? "text-white/60" : "text-muted-text"
                  )}
                >
                  {format(createdAt, "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input — X-style */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border-custom px-4 py-3"
      >
        <Input
          type="text"
          placeholder="Start a new message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 h-[42px] rounded-full border-0 bg-[#EFF3F4] text-[15px] px-5 focus-visible:ring-1 focus-visible:ring-brand focus-visible:bg-white focus-visible:border focus-visible:border-brand"
          disabled={sending}
          autoFocus
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="inline-flex items-center justify-center size-9 rounded-full text-brand disabled:opacity-30 hover:bg-brand/10 transition-colors"
        >
          {sending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </button>
      </form>
    </div>
  );
}
