"use client";

import { useState } from "react";
import { MobileBottomBar } from "./mobile-bottom-bar";
import { MobileNav } from "./mobile-nav";
import { Navbar } from "./navbar";
import { RightSidebar } from "./right-sidebar";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showRightSidebar?: boolean;
}

export function AppShell({
  children,
  showSidebar = true,
  showRightSidebar = false,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FB]">
      <Navbar onMobileMenuToggle={() => setMobileNavOpen(true)} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[248px_minmax(0,760px)_360px] lg:gap-6 lg:px-6">
        {showSidebar && <Sidebar />}

        <main className="w-full min-w-0 bg-white pb-16 lg:my-4 lg:rounded-lg lg:border lg:border-border-custom lg:pb-0 lg:shadow-sm">
          {children}
        </main>

        {showRightSidebar && <RightSidebar />}
      </div>

      <MobileBottomBar />
    </div>
  );
}
