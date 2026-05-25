"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  where,
  limit as firestoreLimit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Users,
  Search,
  Ban,
  CheckCircle2,
  Scale,
  UserRound,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "lawyer" | "client">(
    "all"
  );
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers(true);
  }, [roleFilter]);

  async function fetchUsers(reset = false) {
    if (reset) setLoading(true);

    try {
      let q;
      if (roleFilter === "all") {
        q = query(
          collection(db, "users"),
          orderBy("created_at", "desc"),
          firestoreLimit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", roleFilter),
          orderBy("created_at", "desc"),
          firestoreLimit(PAGE_SIZE)
        );
      }

      if (!reset && lastDoc) {
        if (roleFilter === "all") {
          q = query(
            collection(db, "users"),
            orderBy("created_at", "desc"),
            startAfter(lastDoc),
            firestoreLimit(PAGE_SIZE)
          );
        } else {
          q = query(
            collection(db, "users"),
            where("role", "==", roleFilter),
            orderBy("created_at", "desc"),
            startAfter(lastDoc),
            firestoreLimit(PAGE_SIZE)
          );
        }
      }

      const snap = await getDocs(q);
      const newUsers = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as UserProfile)
      );

      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserActive(userId: string, currentlyActive: boolean) {
    setTogglingId(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        is_active: !currentlyActive,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentlyActive } : u
        )
      );
    } catch (error) {
      console.error("Error toggling user:", error);
    } finally {
      setTogglingId(null);
    }
  }

  const filteredUsers = searchQuery.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border-custom">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-text" />
          <input
            type="search"
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[42px] rounded-full bg-[#EFF3F4] pl-12 pr-4 text-[15px] text-text-primary placeholder:text-muted-text outline-none border border-transparent focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>
      </div>

      {/* Role filter pills */}
      <div className="px-4 py-3 border-b border-border-custom flex gap-2">
        {(["all", "lawyer", "client"] as const).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors inline-flex items-center gap-1.5",
              roleFilter === role
                ? "bg-text-primary text-white"
                : "border border-border-custom text-text-primary hover:bg-[#EFF3F4]"
            )}
          >
            {role === "all" && <Users className="size-3.5" />}
            {role === "lawyer" && <Scale className="size-3.5" />}
            {role === "client" && <UserRound className="size-3.5" />}
            {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : filteredUsers.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <Users className="size-10 text-muted-text mx-auto mb-3" />
          <h2 className="text-[20px] font-extrabold text-text-primary">
            No users found
          </h2>
          <p className="mt-1 text-[15px] text-muted-text">
            No users match your search criteria.
          </p>
        </div>
      ) : (
        <div>
          {filteredUsers.map((u) => {
            const createdAt = u.created_at
              ? typeof u.created_at === "string"
                ? new Date(u.created_at)
                : u.created_at?.toDate?.() ?? new Date()
              : new Date();

            return (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-custom hover:bg-black/[0.03] transition-colors"
              >
                <div className="size-10 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-[15px]">
                  {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-text-primary truncate">
                      {u.full_name}
                    </span>
                    <span className={cn(
                      "text-[11px] font-bold rounded-full px-2 py-0.5",
                      u.role === "lawyer" && "bg-brand/10 text-brand",
                      u.role === "client" && "bg-[#EFF3F4] text-muted-text",
                      u.role === "admin" && "bg-[#F4212E]/10 text-[#F4212E]"
                    )}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-text truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-text">
                    <span className={cn(
                      "inline-flex items-center gap-1",
                      u.is_active ? "text-[#00BA7C]" : "text-[#F4212E]"
                    )}>
                      <span className={cn(
                        "size-1.5 rounded-full",
                        u.is_active ? "bg-[#00BA7C]" : "bg-[#F4212E]"
                      )} />
                      {u.is_active ? "Active" : "Suspended"}
                    </span>
                    <span>·</span>
                    <span>
                      {createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {u.role !== "admin" && (
                  <button
                    disabled={togglingId === u.id}
                    onClick={() => toggleUserActive(u.id, u.is_active)}
                    className={cn(
                      "shrink-0 h-8 px-3 rounded-full text-[13px] font-bold transition-colors disabled:opacity-50",
                      u.is_active
                        ? "border border-[#F4212E]/30 text-[#F4212E] hover:bg-[#F4212E]/5"
                        : "border border-[#00BA7C]/30 text-[#00BA7C] hover:bg-[#00BA7C]/5"
                    )}
                  >
                    {u.is_active ? "Suspend" : "Activate"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="px-4 py-4 text-center">
          <button
            onClick={() => fetchUsers(false)}
            className="h-9 px-5 rounded-full border border-border-custom text-[15px] font-bold text-text-primary hover:bg-[#EFF3F4] transition-colors"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
