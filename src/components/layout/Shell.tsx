"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

/**
 * Authenticated app shell. Sidebar is fixed on the right (RTL);
 * content is offset by its width on large screens.
 */
export function Shell({ title = "نظرة عامة", children }: { title?: string; children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-content">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:mr-64">
        <Topbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
