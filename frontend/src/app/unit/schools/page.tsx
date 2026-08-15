"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface UnitMappedSchool {
  id: string;
  code: string;
  name: string;
  address: string;
  cadetCount: number;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  lifetimeOrders: number;
  lifetimeRevenue: number;
}

export default function UnitSchoolsPage() {
  const [schools, setSchools] = useState<UnitMappedSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Fetch mapped schools using authFetch
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/unit/schools");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: UnitMappedSchool[] = json.data.map((s: any) => ({
            id: s.id,
            code: s.schoolCode || s.code || `SCH-${s.id}`,
            name: s.name,
            address: s.address || "Main Campus",
            cadetCount: s.cadetCount || s.cadets || 0,
            principalName: s.principalName || s.principal || "Principal",
            principalEmail: s.principalEmail || s.email || "N/A",
            principalPhone: s.principalPhone || s.phone || "N/A",
            lifetimeOrders: s.lifetimeOrders || s._count?.orders || 0,
            lifetimeRevenue: s.lifetimeRevenue || s.totalSpent || 0,
          }));
          setSchools(mapped);
        }
      }
    } catch (err) {
      console.error("Unit Schools API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.principalName.toLowerCase().includes(search.toLowerCase())
  );

  const totalCadets = schools.reduce((acc, s) => acc + s.cadetCount, 0);
  const totalOrders = schools.reduce((acc, s) => acc + s.lifetimeOrders, 0);

  return (
    <div className="p-8 space-y-8 flex-1 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-ink-navy">
            Mapped Schools Directory
          </h1>
          <p className="text-steel text-sm mt-1">
            Schools &amp; Enrolled Cadets under Unit Command
          </p>
        </div>

        {loading && (
          <span className="text-xs text-brass font-data-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
            Syncing Unit Schools API...
          </span>
        )}
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="text-xs text-steel uppercase font-bold tracking-wider">
            Total Mapped Schools
          </p>
          <p className="font-data-mono text-3xl font-bold text-ink-navy mt-1">
            {loading ? "..." : schools.length}
          </p>
        </div>

        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="text-xs text-steel uppercase font-bold tracking-wider">
            Enrolled Cadets Under Unit
          </p>
          <p className="font-data-mono text-3xl font-bold text-brass mt-1">
            {loading ? "..." : `${totalCadets} Cadets`}
          </p>
        </div>

        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="text-xs text-steel uppercase font-bold tracking-wider">
            Total Unit Requisitions
          </p>
          <p className="font-data-mono text-3xl font-bold text-delivery-blue mt-1">
            {loading ? "..." : `${totalOrders} Orders`}
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-hairline p-4 rounded flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search mapped school name, code, or principal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper/30 border border-hairline rounded pl-10 pr-4 py-2 text-sm text-ink-navy focus:outline-none focus:border-brass font-sans"
          />
        </div>
        <span className="text-xs text-steel uppercase font-bold tracking-wider">
          Active Unit Command
        </span>
      </div>

      {/* Schools Table */}
      <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
          <span className="text-xs text-steel uppercase font-bold tracking-wider">
            School Allocations ({filteredSchools.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-ink-navy text-paper">
                <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-semibold">
                  School Code &amp; Name
                </th>
                <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-semibold">
                  Enrolled Cadets
                </th>
                <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-semibold">
                  School Head (Principal)
                </th>
                <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-center">
                  Lifetime Orders
                </th>
                <th className="px-6 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-right">
                  Total Requisition Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm text-ink-navy">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    Loading mapped unit schools...
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-steel italic text-sm">
                    No mapped schools found.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-paper/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-data-mono text-xs font-bold text-brass">
                        {s.code}
                      </p>
                      <p className="font-semibold text-ink-navy text-sm mt-0.5">
                        {s.name}
                      </p>
                      <p className="text-xs text-steel line-clamp-1 mt-0.5 font-sans">
                        {s.address}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-data-mono font-bold text-sm text-brass">
                      {s.cadetCount} Cadets
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-xs text-ink-navy">
                        {s.principalName}
                      </p>
                      <p className="text-xs text-steel italic mt-0.5 font-data-mono">
                        {s.principalEmail} • {s.principalPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center font-data-mono font-bold text-ink-navy">
                      {s.lifetimeOrders} Orders
                    </td>
                    <td className="px-6 py-4 text-right font-data-mono font-bold text-settled-green">
                      ₹{s.lifetimeRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
