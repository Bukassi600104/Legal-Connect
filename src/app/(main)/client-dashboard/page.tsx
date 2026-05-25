"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Calendar,
  MessageCircle,
  Search,
  ArrowRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/providers/auth-provider";
import type { Consultation } from "@/types";

export const dynamic = "force-dynamic";

export default function ClientDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    async function fetchData() {
      try {
        const q = query(
          collection(db, "consultations"),
          where("client_id", "==", user!.uid),
          orderBy("scheduled_at", "desc"),
          firestoreLimit(10)
        );
        try {
          const snap = await getDocs(q);
          setConsultations(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consultation))
          );
        } catch {}
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading]);

  if (loading) return <PageLoader />;

  const quickLinks = [
    {
      href: "/explore",
      icon: Search,
      label: "Find a Lawyer",
      sub: "Search by specialization",
    },
    {
      href: "/messages",
      icon: MessageCircle,
      label: "Messages",
      sub: "Chat with lawyers",
    },
    {
      href: "/consultations",
      icon: Calendar,
      label: "Consultations",
      sub: "View your bookings",
    },
  ];

  return (
    <div>
      {/* X-style header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-border-custom px-4 h-[53px] flex items-center">
        <h1 className="text-xl font-extrabold text-text-primary">
          Welcome, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
      </div>

      {/* Quick actions as border-b list */}
      <div>
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
          >
            <div className="size-10 rounded-full bg-brand/10 flex items-center justify-center">
              <link.icon className="size-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-text-primary">
                {link.label}
              </p>
              <p className="text-[13px] text-muted-text">{link.sub}</p>
            </div>
            <ChevronRight className="size-5 text-muted-text" />
          </Link>
        ))}
      </div>

      {/* Recent consultations */}
      <div className="px-4 py-3 border-b border-border-custom">
        <p className="text-[13px] font-bold text-muted-text">
          Recent Consultations
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <Calendar className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            No Consultations Yet
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            Book your first consultation with a lawyer.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-white hover:bg-brand-dark transition-colors"
          >
            Find a Lawyer
          </Link>
        </div>
      ) : (
        <div>
          {consultations.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
            >
              <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center">
                <Clock className="size-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[15px] font-bold text-text-primary capitalize">
                  {c.status}
                </span>
                {c.topic && (
                  <p className="text-[13px] text-muted-text line-clamp-1">
                    {c.topic}
                  </p>
                )}
              </div>
              <span className="text-[12px] text-muted-text shrink-0">
                {c.consultation_type || "General"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
