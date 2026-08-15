"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuthSession } from "@/lib/auth";

export default function UnitSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Schools", href: "/schools", icon: "school" },
    { name: "Orders", href: "/orders", icon: "receipt_long" },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearAuthSession();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[230px] bg-ink-navy flex flex-col py-gutter z-50 font-sans">
      {/* Brand Section */}
      <div className="px-6 mb-8 pt-2">
        <h1 className="text-2xl text-paper font-bold leading-none mb-1 font-headline">
          NCC Portal
        </h1>
        <p className="text-[10px] text-paper/50 tracking-[0.2em] uppercase font-semibold">
          Quartermaster&apos;s Register
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/dashboard" && (pathname === "/unit" || pathname === "/dashboard"));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 transition-all ${
                isActive
                  ? "text-brass font-bold bg-white/5 border-l-2 border-brass"
                  : "text-paper/70 hover:text-paper hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="text-xs uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA & Profile */}
      <div className="px-6 pt-4 mt-auto border-t border-paper/10 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center text-brass font-bold text-xs flex-shrink-0">
            CS
          </div>
          <div className="overflow-hidden">
            <p className="text-paper font-bold text-xs truncate">Capt. Singh</p>
            <p className="text-paper/50 text-[10px] truncate uppercase tracking-tighter">
              Unit Head • 4 Delhi BN
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-paper/50 hover:text-alert-rust transition-colors p-1.5 rounded hover:bg-white/5"
          title="Logout"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </aside>
  );
}
