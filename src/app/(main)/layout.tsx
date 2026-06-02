"use client";

import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell showSidebar showRightSidebar>
      {children}
    </AppShell>
  );
}
