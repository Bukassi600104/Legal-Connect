"use client";

import { useState } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileBottomBar } from "./mobile-bottom-bar";
import { RightSidebar } from "./right-sidebar";

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
    <div className="flex min-h-screen justify-center bg-white">
      {/* Mobile top navbar (hidden on desktop) */}
      <Navbar onMobileMenuToggle={() => setMobileNavOpen(true)} />

      {/* Mobile slide-out drawer */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* X-style 3-column layout */}
      <div className="flex w-full max-w-[1265px]">
        {/* Left Sidebar — fixed, X-style nav */}
        {showSidebar && <Sidebar />}

        {/* Main content — center column with border */}
        <main className="flex-1 min-w-0 max-w-[600px] border-r border-border-custom pb-16 lg:pb-0">
          {children}
        </main>

        {/* Right Sidebar — trending, who to follow */}
        {showRightSidebar && <RightSidebar />}
      </div>

      {/* Mobile bottom tab bar */}
      <MobileBottomBar />
    </div>
  );
}
