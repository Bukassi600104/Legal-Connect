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
  updateDoc,
  writeBatch,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Bell, Check, MessageCircle, UserPlus, Star, Calendar, CreditCard } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Notification, NotificationType } from "@/types";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  new_message: MessageCircle,
  new_follower: UserPlus,
  post_like: Star,
  post_comment: MessageCircle,
  consultation_booking: Calendar,
  consultation_reminder: Calendar,
  verification_update: Check,
  subscription_renewal: CreditCard,
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc"),
      firestoreLimit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Notification)
        );
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      },
      () => {}
    );

    return () => unsubscribe();
  }, [user]);

  async function markAllRead() {
    if (!user || unreadCount === 0) return;

    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.is_read)
        .forEach((n) => {
          batch.update(doc(db, "notifications", n.id), { is_read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  async function markOneRead(notifId: string) {
    try {
      await updateDoc(doc(db, "notifications", notifId), { is_read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  function getNotifLink(notif: Notification): string {
    switch (notif.type) {
      case "new_message":
        return notif.data?.conversation_id
          ? `/messages/${notif.data.conversation_id}`
          : "/messages";
      case "new_follower":
        return notif.data?.follower_slug
          ? `/lawyer/${notif.data.follower_slug}`
          : "/dashboard";
      case "consultation_booking":
      case "consultation_reminder":
        return "/consultations";
      case "verification_update":
        return "/dashboard/profile";
      case "post_like":
      case "post_comment":
        return "/feed";
      default:
        return "/feed";
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center size-9 rounded-full text-muted-text hover:bg-brand/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border-custom bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-border-custom px-4 py-3">
              <h3 className="text-[15px] font-extrabold text-text-primary">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[13px] font-bold text-brand hover:text-brand-dark"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto size-8 text-muted-text" />
                  <p className="mt-2 text-[13px] text-muted-text">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon =
                    NOTIFICATION_ICONS[notif.type] || Bell;
                  const createdAt = notif.created_at
                    ? typeof notif.created_at === "string"
                      ? new Date(notif.created_at)
                      : notif.created_at?.toDate?.() ?? new Date()
                    : new Date();

                  return (
                    <Link
                      key={notif.id}
                      href={getNotifLink(notif)}
                      onClick={() => {
                        if (!notif.is_read) markOneRead(notif.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 border-b border-border-custom px-4 py-3 transition-colors hover:bg-black/[0.03]",
                        !notif.is_read && "bg-brand/5"
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Icon className="size-4 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-text-primary line-clamp-1">
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-[12px] text-muted-text line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-text">
                          {formatDistanceToNow(createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
