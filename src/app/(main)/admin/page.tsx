"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Users,
  Scale,
  FileText,
  BadgeCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";

export const dynamic = "force-dynamic";

interface PlatformStats {
  totalUsers: number;
  totalLawyers: number;
  totalClients: number;
  totalPosts: number;
  pendingVerifications: number;
  activeConsultations: number;
  totalConversations: number;
  reportedContent: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          usersSnap,
          lawyersSnap,
          clientsSnap,
          postsSnap,
          pendingVerifSnap,
          consultSnap,
          convosSnap,
        ] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(
            query(collection(db, "users"), where("role", "==", "lawyer"))
          ),
          getCountFromServer(
            query(collection(db, "users"), where("role", "==", "client"))
          ),
          getCountFromServer(collection(db, "posts")),
          getCountFromServer(
            query(
              collection(db, "verification_requests"),
              where("status", "==", "pending")
            )
          ),
          getCountFromServer(
            query(
              collection(db, "consultations"),
              where("status", "in", ["pending", "confirmed"])
            )
          ),
          getCountFromServer(collection(db, "conversations")),
        ]);

        setStats({
          totalUsers: usersSnap.data().count,
          totalLawyers: lawyersSnap.data().count,
          totalClients: clientsSnap.data().count,
          totalPosts: postsSnap.data().count,
          pendingVerifications: pendingVerifSnap.data().count,
          activeConsultations: consultSnap.data().count,
          totalConversations: convosSnap.data().count,
          reportedContent: 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setStats({
          totalUsers: 0, totalLawyers: 0, totalClients: 0, totalPosts: 0,
          pendingVerifications: 0, activeConsultations: 0,
          totalConversations: 0, reportedContent: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  const statItems = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users },
    { label: "Lawyers", value: stats?.totalLawyers ?? 0, icon: Scale },
    { label: "Clients", value: stats?.totalClients ?? 0, icon: Users },
    { label: "Posts", value: stats?.totalPosts ?? 0, icon: FileText },
    { label: "Pending Verifications", value: stats?.pendingVerifications ?? 0, icon: BadgeCheck },
    { label: "Active Consultations", value: stats?.activeConsultations ?? 0, icon: Clock },
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: TrendingUp },
    { label: "Reported Content", value: stats?.reportedContent ?? 0, icon: AlertTriangle },
  ];

  return (
    <div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 border-b border-border-custom">
        {statItems.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-4 py-4 ${
              i % 2 === 0 ? "border-r" : ""
            } border-b border-border-custom`}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-brand/10 flex items-center justify-center">
                <stat.icon className="size-5 text-brand" />
              </div>
              <div>
                <p className="text-[20px] font-extrabold text-text-primary">
                  {stat.value}
                </p>
                <p className="text-[12px] text-muted-text">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick cards */}
      <div className="px-4 py-4 border-b border-border-custom">
        <div className="rounded-2xl bg-[#F7F9F9] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="size-5 text-brand" />
            <h3 className="text-[15px] font-bold text-text-primary">
              Verification Queue
            </h3>
          </div>
          <p className="text-[31px] font-extrabold text-text-primary">
            {stats?.pendingVerifications ?? 0}
          </p>
          <p className="text-[13px] text-muted-text">
            lawyers awaiting verification review
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-2xl bg-[#F7F9F9] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="size-5 text-brand" />
            <h3 className="text-[15px] font-bold text-text-primary">
              Platform Revenue
            </h3>
          </div>
          <p className="text-[31px] font-extrabold text-text-primary">₦0</p>
          <p className="text-[13px] text-muted-text">
            Paystack integration active
          </p>
        </div>
      </div>
    </div>
  );
}
