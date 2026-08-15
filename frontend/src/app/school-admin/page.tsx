"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authFetch, getAuthUser } from "@/lib/auth";

export interface SchoolRecentOrder {
  id: string;
  orderCode: string;
  packetName: string;
  deliveryDate: string;
  qty: number;
  status: string;
}

export default function SchoolDashboardPage() {
  const [recentOrders, setRecentOrders] = useState<SchoolRecentOrder[]>([]);
  const [schoolName, setSchoolName] = useState<string>("School Administration");
  const [stats, setStats] = useState({
    enrolledCadets: 0,
    totalOrders: 0,
    activeOrders: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [todayDate, setTodayDate] = useState<string>("");

  useEffect(() => {
    const user = getAuthUser();
    if (user?.schoolName) {
      setSchoolName(user.schoolName);
    }

    const now = new Date();
    const formatted = now
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
    setTodayDate(formatted);
  }, []);

  // Fetch School Head Dashboard Overview Data via authFetch
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/school-admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.schoolName) {
            setSchoolName(json.data.schoolName);
          }
          setStats({
            enrolledCadets: json.data.enrolledCadets || json.data.cadets || 0,
            totalOrders: json.data.totalOrders || 0,
            activeOrders: json.data.activeOrders || json.data.pendingOrders || 0,
          });
          if (Array.isArray(json.data.recentOrders)) {
            const mapped: SchoolRecentOrder[] = json.data.recentOrders.map((o: any) => ({
              id: o.id,
              orderCode: o.orderCode || o.code || `#ORD-${o.id}`,
              packetName: o.packetName || o.packet?.name || "Refreshment Packet",
              deliveryDate: o.deliveryDate || "TBD",
              qty: o.quantity || o.qty || 0,
              status: o.status || "PENDING",
            }));
            setRecentOrders(mapped);
          }
        }
      }
    } catch (err) {
      console.error("School Dashboard API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="p-8 space-y-8 flex-1 font-sans relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 font-sans">
        <div>
          <h2 className="text-3xl font-headline font-bold text-ink-navy">
            {schoolName} — Dashboard
          </h2>
          <p className="text-steel font-sans text-sm mt-1">
            Institutional Requisitions &amp; Cadet Refreshment Management
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Place Requisition Order CTA Button */}
          <Link
            href="/orders"
            className="bg-brass hover:bg-brass/90 text-white font-bold px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest font-sans"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span>Place Requisition Order</span>
          </Link>

          <div className="text-right pl-4 border-l border-hairline font-sans">
            <p className="text-[10px] text-steel font-sans uppercase font-bold tracking-widest mb-0.5">
              Today&apos;s Ledger Date
            </p>
            <p className="font-data-mono text-xl font-bold text-ink-navy">
              {todayDate || "TODAY"}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="bg-white border border-hairline p-6 flex flex-col justify-between relative overflow-hidden shadow-sm rounded-sm">
          <div className="z-10">
            <p className="text-[10px] text-steel font-sans uppercase font-bold tracking-widest mb-2">
              Enrolled Cadets
            </p>
            <h3 className="font-data-mono text-4xl text-ink-navy font-bold">
              {loading ? "..." : stats.enrolledCadets}
            </h3>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-ink-navy/5 text-8xl pointer-events-none">
            group
          </span>
        </div>

        <div className="bg-white border border-hairline p-6 flex flex-col justify-between relative overflow-hidden shadow-sm rounded-sm">
          <div className="z-10">
            <p className="text-[10px] text-steel font-sans uppercase font-bold tracking-widest mb-2">
              Total Requisitions Placed
            </p>
            <h3 className="font-data-mono text-4xl text-ink-navy font-bold">
              {loading ? "..." : stats.totalOrders}
            </h3>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-ink-navy/5 text-8xl pointer-events-none">
            inventory_2
          </span>
        </div>

        <div className="bg-white border border-hairline p-6 flex flex-col justify-between relative overflow-hidden border-l-4 border-l-brass shadow-sm rounded-sm">
          <div className="z-10">
            <p className="text-[10px] text-brass font-sans uppercase font-bold tracking-widest mb-2">
              Active Requisitions Queue
            </p>
            <h3 className="font-data-mono text-4xl text-brass font-bold">
              {loading ? "..." : stats.activeOrders}
            </h3>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-brass/5 text-8xl pointer-events-none">
            pending_actions
          </span>
        </div>
      </div>

      {/* Main Content: School Requisitions Register */}
      <section className="bg-white border border-hairline overflow-hidden flex flex-col relative shadow-sm rounded-sm font-sans">
        <div className="px-6 py-5 border-b border-hairline flex justify-between items-center bg-paper/20">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-headline font-bold text-ink-navy">
              Recent Requisition Orders
            </h4>
            {loading && (
              <span className="text-xs text-brass font-data-mono animate-pulse">
                Syncing API...
              </span>
            )}
          </div>
          <Link
            href="/orders"
            className="text-brass text-[10px] font-sans font-bold uppercase tracking-widest flex items-center space-x-1 hover:underline"
          >
            <span>View All Orders</span>
            <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-hairline bg-paper/30">
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold">
                  Order ID
                </th>
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold">
                  Packet Type
                </th>
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold">
                  Delivery Date
                </th>
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold text-center">
                  Qty (Packets)
                </th>
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-ink-navy divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    Loading school requisitions...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    No recent requisitions found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => {
                  let badgeClass = "bg-brass/10 text-brass border-brass/20";
                  if (ord.status === "DELIVERED") badgeClass = "bg-settled-green/10 text-settled-green border-settled-green/20";
                  else if (ord.status === "CANCELLED") badgeClass = "bg-alert-rust/10 text-alert-rust border-alert-rust/20";

                  return (
                    <tr key={ord.id} className="hover:bg-paper/10 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-data-mono font-bold text-brass">{ord.orderCode}</td>
                      <td className="px-6 py-4 font-bold text-ink-navy">{ord.packetName}</td>
                      <td className="px-6 py-4 font-data-mono text-delivery-blue font-bold text-xs">
                        {ord.deliveryDate}
                      </td>
                      <td className="px-6 py-4 font-data-mono text-center font-bold text-base">{ord.qty}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-sm text-[9px] font-bold tracking-widest border uppercase font-sans ${badgeClass}`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* System Footer */}
      <footer className="mt-auto p-4 border border-hairline bg-white/50 text-steel text-[10px] font-sans font-bold uppercase tracking-wider flex justify-between items-center rounded-sm">
        <p>© National Cadet Corps (NCC) - Directorate General Logistics</p>
        <div className="flex space-x-4">
          <a
            className="hover:text-ink-navy transition-colors underline decoration-hairline"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Institutional Manual
          </a>
        </div>
      </footer>
    </div>
  );
}
