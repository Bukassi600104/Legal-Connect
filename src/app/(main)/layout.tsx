"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppShell showSidebar showRightSidebar>
          {children}
        </AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
