"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authFetch, getAuthUser } from "@/lib/auth";

export interface UnitRecentOrder {
  id: string;
  orderCode: string;
  schoolName: string;
  deliveryDate: string;
  qty: number;
  status: "PENDING" | "SETTLED" | "DISPUTED" | "DISBURSED" | string;
}

export default function UnitDashboardPage() {
  const [recentOrders, setRecentOrders] = useState<UnitRecentOrder[]>([]);
  const [unitName, setUnitName] = useState<string>("Unit Command");
  const [stats, setStats] = useState({
    schoolsCount: 0,
    ordersThisMonth: 0,
    deliveriesThisWeek: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [todayDate, setTodayDate] = useState<string>("");

  useEffect(() => {
    const user = getAuthUser();
    if (user?.unitName) {
      setUnitName(user.unitName);
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

  // Fetch Unit Dashboard data using authFetch
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/unit/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.unitName) {
            setUnitName(json.data.unitName);
          }
          setStats({
            schoolsCount: json.data.schoolsCount || 0,
            ordersThisMonth: json.data.ordersThisMonth || 0,
            deliveriesThisWeek: json.data.deliveriesThisWeek || 0,
          });
          if (Array.isArray(json.data.recentOrders)) {
            const mappedOrders: UnitRecentOrder[] = json.data.recentOrders.map((o: any) => ({
              id: o.id,
              orderCode: o.orderCode || o.code || `#ORD-${o.id}`,
              schoolName: o.schoolName || o.school?.name || "Mapped School",
              deliveryDate: o.deliveryDate || "TBD",
              qty: o.quantity || o.qty || 0,
              status: o.status || "PENDING",
            }));
            setRecentOrders(mappedOrders);
          }
        }
      }
    } catch (err) {
      console.error("Unit Dashboard API error:", err);
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-ink-navy">
            {unitName} — Dashboard
          </h2>
          <p className="text-steel font-sans text-sm mt-1">
            Official Register of Logistics &amp; Unit Oversight
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Place Requisition Order CTA Button */}
          <Link
            href="/orders"
            className="px-5 py-2.5 bg-brass hover:brightness-110 text-white rounded text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 transition-all font-sans"
          >
            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>Place Requisition Order</span>
          </Link>
          <div className="text-right">
            <span className="text-[10px] text-steel font-bold uppercase tracking-widest font-sans block">
              System Time:
            </span>
            <span className="text-xs font-bold text-brass font-data-mono">{todayDate}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="bg-white border-2 border-hairline p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-steel font-bold uppercase tracking-widest font-sans block">
              Mapped Institutions
            </span>
            <span className="font-data-mono text-3xl font-bold text-ink-navy mt-1 block">
              {loading ? "..." : stats.schoolsCount}
            </span>
            <span className="text-[11px] text-steel font-semibold mt-1 block">
              Schools under Unit Command
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-paper border border-hairline flex items-center justify-center text-ink-navy">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
        </div>

        <div className="bg-white border-2 border-hairline p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-steel font-bold uppercase tracking-widest font-sans block">
              Requisitions Placed
            </span>
            <span className="font-data-mono text-3xl font-bold text-brass mt-1 block">
              {loading ? "..." : stats.ordersThisMonth}
            </span>
            <span className="text-[11px] text-steel font-semibold mt-1 block">
              Active requisitions in process
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
            <span className="material-symbols-outlined text-2xl">orders</span>
          </div>
        </div>

        <div className="bg-white border-2 border-hairline p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-steel font-bold uppercase tracking-widest font-sans block">
              Fulfilled Deliveries
            </span>
            <span className="font-data-mono text-3xl font-bold text-settled-green mt-1 block">
              {loading ? "..." : stats.deliveriesThisWeek}
            </span>
            <span className="text-[11px] text-steel font-semibold mt-1 block">
              Completed Refreshment Dispatches
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-settled-green/10 border border-settled-green/20 flex items-center justify-center text-settled-green">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Register */}
      <section className="bg-white border-2 border-hairline rounded-lg overflow-hidden shadow-sm relative">
        <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center font-sans">
          <div>
            <h3 className="font-headline font-bold text-xl text-ink-navy">
              Recent Requisition Activity
            </h3>
            <p className="text-xs text-steel font-semibold">
              Logistics register of dispatches to mapped schools
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-brass uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            <span>View All Requisitions</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-paper/60">
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold">
                  Order Code
                </th>
                <th className="px-6 py-4 text-[10px] text-steel font-sans uppercase tracking-[0.2em] font-bold">
                  Target School
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
            <tbody className="text-sm text-ink-navy divide-y divide-hairline font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    Loading recent unit orders from ledger...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    No recent requisition orders found for this unit.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-paper/10 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-data-mono font-bold text-brass">
                      {ord.orderCode}
                    </td>
                    <td className="px-6 py-4 font-sans font-bold text-ink-navy">{ord.schoolName}</td>
                    <td className="px-6 py-4 font-data-mono text-delivery-blue font-bold text-xs">
                      {ord.deliveryDate}
                    </td>
                    <td className="px-6 py-4 font-data-mono text-center font-bold text-base">
                      {ord.qty}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-sm bg-brass/10 text-brass text-[9px] font-bold tracking-widest border border-brass/20 uppercase font-sans">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-paper/10 flex justify-between items-center font-sans">
          <p className="text-[10px] text-steel font-semibold">
            Displaying {recentOrders.length} entries.
          </p>
        </div>

        {/* Rotated Requisition Stamp */}
        <div className="requisition-stamp absolute right-5 bottom-12 w-24 h-24 border-2 border-brass rounded-full flex flex-col items-center justify-center text-brass font-data-mono font-bold text-[9px] uppercase tracking-tighter -rotate-12 opacity-30 pointer-events-none text-center leading-tight">
          APPROVED<br />UNIT HQ
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
            Operational Guidelines
          </a>
        </div>
      </footer>
    </div>
  );
}
