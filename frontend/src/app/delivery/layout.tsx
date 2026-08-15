"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuthSession } from "@/lib/auth";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearAuthSession();
    window.location.href = "/login";
  };

  const isHistory = pathname.includes("/history");

  return (
    <div className="bg-paper/40 text-ink-navy min-h-screen flex flex-col font-sans">
      {/* Top Delivery Header */}
      <header className="bg-ink-navy text-paper border-b-2 border-brass px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brass flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <div>
              <h1 className="font-headline font-bold text-xl text-white tracking-tight">
                Delivery Agent Portal
              </h1>
              <p className="text-[11px] text-brass uppercase font-bold tracking-widest font-sans">
                Procurement Logistics Command
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg border border-white/20">
            <Link
              href="/delivery"
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                !isHistory
                  ? "bg-brass text-white shadow-sm"
                  : "text-paper/80 hover:text-white hover:bg-white/10"
              }`}
            >
              My Deliveries
            </Link>
            <Link
              href="/history"
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                isHistory
                  ? "bg-brass text-white shadow-sm"
                  : "text-paper/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Delivery History
            </Link>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/30 rounded text-xs font-bold text-paper/80 hover:bg-alert-rust hover:text-white hover:border-alert-rust transition-colors cursor-pointer"
            title="Logout Session"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-white py-4 px-6 text-center text-xs text-steel font-sans">
        Procurement Ledger &copy; 2026 • Logistics &amp; Delivery Oversight System
      </footer>
    </div>
  );
}
