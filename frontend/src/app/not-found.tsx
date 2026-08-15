"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    if (q.includes("order") || q.includes("ord")) {
      router.push("/orders");
    } else if (q.includes("report") || q.includes("invoice")) {
      router.push("/reports");
    } else if (q.includes("delivery") || q.includes("driver")) {
      router.push("/delivery");
    } else if (q.includes("packet") || q.includes("sku")) {
      router.push("/packets");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1714] text-[#E8E4D9] font-sans relative overflow-hidden flex flex-col justify-between select-none">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Radar Glow Sweep Circle */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#2D4F3E]/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* TOP DOCKED NAVIGATION BAR */}
      <header className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-[#0F1714]/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#C5A059] bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
            <span className="material-symbols-outlined text-base">shield</span>
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-[#C5A059] block font-data-mono">
              NCC Quartermaster Register
            </span>
            <span className="text-[10px] text-white/50 font-medium">
              Delhi Directorate Procurement Portal
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-data-mono text-[11px] text-white/60 bg-white/5 px-3 py-1.5 rounded border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping"></span>
          <span>SYSTEM TIME: {mounted ? timestamp : "INITIALIZING..."}</span>
        </div>
      </header>

      {/* MAIN 404 HERO CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-20 max-w-4xl mx-auto space-y-8">
        {/* Large 404 Visual Stamp Badge */}
        <div className="relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[#C5A059]/20 blur-2xl rounded-full"></div>

          {/* Big 404 Numerals */}
          <h1 className="font-headline-lg font-black text-8xl sm:text-9xl md:text-[140px] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#F4F1EA] via-[#C5A059] to-[#8C6D37] leading-none drop-shadow-2xl">
            404
          </h1>

          {/* Official Audit Stamp Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] border-4 border-[#E63946] text-[#E63946] px-6 py-2 rounded uppercase font-bold text-xs sm:text-sm tracking-widest bg-[#0F1714]/90 shadow-2xl pointer-events-none whitespace-nowrap">
            <span>UNMAPPED REQUISITION ROUTE</span>
            <span className="block text-[8px] tracking-normal text-white/60">ERR_PAGE_NOT_FOUND_INDEX</span>
          </div>
        </div>

        {/* Descriptive Guidance Header */}
        <div className="space-y-3 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            Requisition Record Not Found
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            The target URL route or ledger item you requested does not exist or has been relocated within the Quartermaster Registry.
          </p>
        </div>

        {/* Quick Search Redirect Input */}
        <form
          onSubmit={handleSearchRedirect}
          className="w-full max-w-md bg-white/5 border border-white/15 p-1.5 rounded-lg flex items-center gap-2 focus-within:border-[#C5A059] transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-white/40 pl-3 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, reports, delivery portal..."
            className="w-full bg-transparent text-xs text-[#F4F1EA] focus:outline-none placeholder-white/40 font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-bold rounded text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Find Route
          </button>
        </form>

        {/* ACTION BUTTONS & QUICK SHORTCUTS */}
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-[#F4F1EA] font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Go Back Previous</span>
          </button>

          <Link
            href="/"
            className="px-7 py-3 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* QUICK PORTAL NAVIGATION CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl pt-6">
          <Link
            href="/orders"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C5A059]/50 rounded-lg text-left transition-all group"
          >
            <span className="material-symbols-outlined text-[#C5A059] text-xl group-hover:scale-110 transition-transform block mb-1">
              receipt_long
            </span>
            <span className="font-bold text-xs text-[#F4F1EA] block">Master Orders</span>
            <span className="text-[10px] text-white/50">Requisition Register</span>
          </Link>

          <Link
            href="/reports"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C5A059]/50 rounded-lg text-left transition-all group"
          >
            <span className="material-symbols-outlined text-[#C5A059] text-xl group-hover:scale-110 transition-transform block mb-1">
              assessment
            </span>
            <span className="font-bold text-xs text-[#F4F1EA] block">Monthly Reports</span>
            <span className="text-[10px] text-white/50">Tax Invoice Generator</span>
          </Link>

          <Link
            href="/delivery"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C5A059]/50 rounded-lg text-left transition-all group"
          >
            <span className="material-symbols-outlined text-[#C5A059] text-xl group-hover:scale-110 transition-transform block mb-1">
              local_shipping
            </span>
            <span className="font-bold text-xs text-[#F4F1EA] block">Delivery Portal</span>
            <span className="text-[10px] text-white/50">Field Dispatch Schedule</span>
          </Link>

          <Link
            href="/packets"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C5A059]/50 rounded-lg text-left transition-all group"
          >
            <span className="material-symbols-outlined text-[#C5A059] text-xl group-hover:scale-110 transition-transform block mb-1">
              inventory_2
            </span>
            <span className="font-bold text-xs text-[#F4F1EA] block">Packets Catalog</span>
            <span className="text-[10px] text-white/50">Refreshment SKUs</span>
          </Link>
        </div>
      </main>

      {/* SYSTEM FOOTER BAR */}
      <footer className="px-8 py-4 border-t border-white/10 bg-[#0F1714]/80 text-center sm:flex sm:justify-between sm:items-center text-[11px] text-white/40 font-data-mono relative z-20">
        <div>NCC REFRESHMENT REQUISITION &amp; DISPATCH LEDGER SYSTEM</div>
        <div className="mt-1 sm:mt-0 text-[#C5A059]">STATUS: HTTP 404 NOT FOUND • AUDIT SECURE</div>
      </footer>
    </div>
  );
}