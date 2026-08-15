"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface MappedSchool {
  schoolId: string;
  schoolName: string;
  studentCount: number;
}

export interface UnitItem {
  id: string;
  name: string;
  spocName: string;
  spocPhone: string;
  spocEmail: string;
  schoolCount: number;
  activeOrders: number;
  totalStudents: number;
  mappedSchools: MappedSchool[];
}


export default function AdminUnitsPage() {
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Side Panel Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form State for Add Unit
  const [formData, setFormData] = useState({
    unitName: "",
    spocName: "",
    spocEmail: "",
    spocPhone: "",
    password: "",
  });

  // -------------------------------------------------------------------
  // API INTEGRATION: FETCH UNITS (authFetch GET /api/admin/units)
  // -------------------------------------------------------------------
  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/units");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: UnitItem[] = json.data.map((u: any) => ({
            id: u.unitCode || u.id,
            name: u.name,
            spocName: u.spocName,
            spocPhone: u.spocPhone || "+91-98000-00000",
            spocEmail: u.spocEmail,
            schoolCount: u.schoolCount || u.mappedSchools?.length || 0,
            activeOrders: u.activeOrders || 0,
            totalStudents: u.totalStudents || 0,
            mappedSchools: u.mappedSchools || [],
          }));
          setUnits(mapped);
        }
      }
    } catch (err) {
      console.warn("Backend API not reached via authFetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Filter Units
  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.spocName.toLowerCase().includes(search.toLowerCase()) ||
      u.spocEmail.toLowerCase().includes(search.toLowerCase())
  );

  // Stats Calculations
  const totalUnits = units.length;
  const totalSchoolsMapped = units.reduce((acc, u) => acc + u.schoolCount, 0);
  const totalCadets = units.reduce((acc, u) => acc + u.totalStudents, 0);
  const totalActiveOrders = units.reduce((acc, u) => acc + u.activeOrders, 0);

  // -------------------------------------------------------------------
  // API INTEGRATION: AUTHORIZE NEW UNIT (authFetch POST /api/admin/units)
  // -------------------------------------------------------------------
  const handleAuthorizeUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitName || !formData.spocName || !formData.spocEmail) {
      alert("Please fill in the unit name, SPOC name, and SPOC email.");
      return;
    }

    setSubmitting(true);

    const autoCode = `UNIT-00${units.length + 1}`;
    const payload = {
      unitCode: autoCode,
      name: formData.unitName,
      spocName: formData.spocName,
      spocPhone: formData.spocPhone || "+91-98000-00000",
      spocEmail: formData.spocEmail,
      password: formData.password || "TemporaryPass123!",
    };

    try {
      const res = await authFetch("/api/admin/units", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadUnits();
      } else {
        // Fallback optimistic update
        const newUnit: UnitItem = {
          id: autoCode,
          name: formData.unitName,
          spocName: formData.spocName,
          spocPhone: formData.spocPhone || "+91-98000-00000",
          spocEmail: formData.spocEmail,
          schoolCount: 0,
          activeOrders: 0,
          totalStudents: 0,
          mappedSchools: [],
        };
        setUnits([newUnit, ...units]);
      }
    } catch (err) {
      console.error("Authorize Unit API error, applying local state update:", err);
      const newUnit: UnitItem = {
        id: autoCode,
        name: formData.unitName,
        spocName: formData.spocName,
        spocPhone: formData.spocPhone || "+91-98000-00000",
        spocEmail: formData.spocEmail,
        schoolCount: 0,
        activeOrders: 0,
        totalStudents: 0,
        mappedSchools: [],
      };
      setUnits([newUnit, ...units]);
    } finally {
      setSubmitting(false);
      setIsModalOpen(false);
      setFormData({
        unitName: "",
        spocName: "",
        spocEmail: "",
        spocPhone: "",
        password: "",
      });
    }
  };

  const toggleExpandUnit = (id: string) => {
    setExpandedUnitId(expandedUnitId === id ? null : id);
  };

  return (
    <div className="p-container-padding flex-1 bg-paper/30 font-sans">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
            Units
          </h1>
          <p className="font-sans text-sm text-steel mt-1">
            Institutional Unit Register &amp; Multi-Unit Cadet Distributions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-brass font-data-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
              Syncing Units API...
            </span>
          )}
          <div className="flex bg-white border border-hairline rounded p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-xs font-sans font-bold uppercase transition-colors ${
                viewMode === "table"
                  ? "bg-ink-navy text-paper"
                  : "text-steel hover:text-ink-navy"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded text-xs font-sans font-bold uppercase transition-colors ${
                viewMode === "grid"
                  ? "bg-ink-navy text-paper"
                  : "text-steel hover:text-ink-navy"
              }`}
            >
              Card View
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brass hover:bg-brass/90 text-white font-bold px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest font-sans"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Unit
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-hairline p-4 rounded mb-stack-md flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by unit name or SPOC officer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper/30 border border-hairline rounded pl-10 pr-4 py-2 text-sm text-ink-navy focus:outline-none focus:border-brass font-sans"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Filter Status:
          </span>
          <span className="px-3 py-1 bg-settled-green/10 text-settled-green border border-settled-green/20 rounded text-xs font-bold font-sans uppercase">
            Active Command
          </span>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
            <span className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
              Master Ledger: Regional Distribution Units ({filteredUnits.length})
            </span>
            <span className="text-xs text-steel font-sans italic">
              Note: Schools can map cadets across multiple units. Click a row to inspect school allocations.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-ink-navy">
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Unit Name
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Mapped Schools
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Enrolled Cadets
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Unit SPOC Name
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Contact Phone
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                    Official Email
                  </th>
                  <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-steel italic font-sans">
                      No units found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => {
                    const isExpanded = expandedUnitId === unit.id;
                    return (
                      <React.Fragment key={unit.id}>
                        <tr
                          onClick={() => toggleExpandUnit(unit.id)}
                          className="hover:bg-paper/40 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 font-sans font-semibold text-ink-navy text-sm">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-steel group-hover:text-brass transition-colors text-lg">
                                {isExpanded ? "expand_more" : "chevron_right"}
                              </span>
                              <span>{unit.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-data-mono font-bold text-sm text-steel">
                            {unit.schoolCount} Schools
                          </td>
                          <td className="px-6 py-4 font-data-mono font-bold text-sm text-brass">
                            {unit.totalStudents} Cadets
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-ink-navy">
                            {unit.spocName}
                          </td>
                          <td className="px-6 py-4 font-data-mono text-xs text-steel">
                            {unit.spocPhone}
                          </td>
                          <td className="px-6 py-4 font-sans text-xs text-steel italic underline underline-offset-4 decoration-hairline">
                            {unit.spocEmail}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandUnit(unit.id);
                              }}
                              className="text-brass hover:text-ink-navy p-1 transition-colors"
                              title="View School & Cadet Breakdown"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit_note
                              </span>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded School & Student Breakdown Row */}
                        {isExpanded && (
                          <tr className="bg-paper/50">
                            <td colSpan={7} className="px-8 py-4 border-b border-hairline">
                              <div className="bg-white p-4 rounded border border-hairline space-y-3 font-sans">
                                <h4 className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-2">
                                  <span className="material-symbols-outlined text-brass text-sm">
                                    school
                                  </span>
                                  Schools &amp; Cadet Breakdown under {unit.name}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {unit.mappedSchools.length === 0 ? (
                                    <p className="text-xs text-steel italic col-span-3">
                                      No schools mapped to this unit yet.
                                    </p>
                                  ) : (
                                    unit.mappedSchools.map((sch) => (
                                      <div
                                        key={sch.schoolId}
                                        className="p-3 bg-paper/40 rounded border border-hairline flex justify-between items-center"
                                      >
                                        <div>
                                          <p className="font-semibold text-xs text-ink-navy">
                                            {sch.schoolName}
                                          </p>
                                          <p className="text-[10px] font-data-mono text-steel">
                                            Code: {sch.schoolId}
                                          </p>
                                        </div>
                                        <span className="font-data-mono font-bold text-xs bg-brass/10 text-brass px-2 py-1 rounded">
                                          {sch.studentCount} Cadets
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="bg-white border border-hairline rounded p-6 shadow-sm hover:border-brass transition-all flex flex-col justify-between font-sans"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-paper rounded text-brass">
                    <span className="material-symbols-outlined text-2xl">
                      group_work
                    </span>
                  </div>
                  <span className="font-data-mono text-xs bg-brass/10 text-brass px-2.5 py-1 rounded font-bold">
                    {unit.totalStudents} Cadets Enrolled
                  </span>
                </div>

                <h3 className="font-headline-md text-xl font-bold text-ink-navy mb-1">
                  {unit.name}
                </h3>
                <p className="text-steel font-sans text-xs mb-4">
                  SPOC: <strong className="text-ink-navy">{unit.spocName}</strong> ({unit.spocEmail})
                </p>

                <div className="border-t border-hairline pt-3 mb-4">
                  <p className="font-sans text-[11px] font-bold text-steel uppercase mb-2">
                    Mapped Schools ({unit.schoolCount}):
                  </p>
                  <div className="space-y-2">
                    {unit.mappedSchools.map((sch) => (
                      <div
                        key={sch.schoolId}
                        className="flex justify-between items-center text-xs font-sans bg-paper/40 p-2 rounded border border-hairline"
                      >
                        <span className="truncate max-w-[200px] text-ink-navy">
                          {sch.schoolName}
                        </span>
                        <span className="font-data-mono font-bold text-steel">
                          {sch.studentCount} Cadets
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex justify-between items-center text-xs text-steel font-sans">
                <span>Active Orders: <strong className="font-data-mono text-ink-navy">{unit.activeOrders}</strong></span>
                <button
                  onClick={() => toggleExpandUnit(unit.id)}
                  className="text-brass hover:underline font-bold uppercase tracking-wider text-[10px]"
                >
                  Manage Mapped Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Summary Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mt-8">
        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Total Command Units
          </p>
          <p className="font-data-mono text-3xl font-bold text-ink-navy mt-1">
            {totalUnits}
          </p>
        </div>

        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Total Unit Mappings
          </p>
          <p className="font-data-mono text-3xl font-bold text-ink-navy mt-1">
            {totalSchoolsMapped}
          </p>
        </div>

        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Total Enrolled Cadets
          </p>
          <p className="font-data-mono text-3xl font-bold text-brass mt-1">
            {totalCadets}
          </p>
        </div>

        <div className="bg-white border border-hairline p-5 rounded shadow-sm">
          <p className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Active Requisitions
          </p>
          <p className="font-data-mono text-3xl font-bold text-delivery-blue mt-1">
            {totalActiveOrders}
          </p>
        </div>
      </div>

      {/* Side Panel Drawer / Modal: Add New Unit */}
      {isModalOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-ink-navy/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
          ></div>

          {/* Modal Content */}
          <aside className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-white border-l border-hairline shadow-2xl z-[70] flex flex-col transition-transform duration-300">
            <div className="p-6 border-b border-hairline flex justify-between items-center bg-paper/50">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-ink-navy">
                  Add New Unit
                </h3>
                <p className="font-sans text-xs text-steel mt-0.5">
                  Record a new administrative unit to the ledger.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-steel hover:text-alert-rust transition-colors p-1"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAuthorizeUnit} className="p-6 space-y-5 flex-1 overflow-y-auto font-sans">
              <div className="space-y-1.5">
                <label className="block font-sans text-xs uppercase text-steel font-bold">
                  Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5th Cavalry Division"
                  value={formData.unitName}
                  onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                  className="w-full border border-hairline bg-white focus:outline-none focus:border-brass p-2.5 text-sm rounded text-ink-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-sans text-xs uppercase text-steel font-bold">
                  Unit SPOC Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name of designated officer"
                  value={formData.spocName}
                  onChange={(e) => setFormData({ ...formData, spocName: e.target.value })}
                  className="w-full border border-hairline bg-white focus:outline-none focus:border-brass p-2.5 text-sm rounded text-ink-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-sans text-xs uppercase text-steel font-bold">
                  SPOC Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91-98765-43210"
                  value={formData.spocPhone}
                  onChange={(e) => setFormData({ ...formData, spocPhone: e.target.value })}
                  className="w-full border border-hairline bg-white focus:outline-none focus:border-brass p-2.5 text-sm rounded text-ink-navy font-data-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-sans text-xs uppercase text-steel font-bold">
                  SPOC Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="official@ncc.gov.in"
                  value={formData.spocEmail}
                  onChange={(e) => setFormData({ ...formData, spocEmail: e.target.value })}
                  className="w-full border border-hairline bg-white focus:outline-none focus:border-brass p-2.5 text-sm rounded text-ink-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-sans text-xs uppercase text-steel font-bold">
                  Assign Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-hairline bg-white focus:outline-none focus:border-brass p-2.5 text-sm rounded text-ink-navy font-data-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-ink-navy"
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline border-dashed">
                <div className="bg-paper/60 p-4 rounded border border-hairline">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-brass text-lg">
                      info
                    </span>
                    <p className="text-xs text-steel italic">
                      By authorizing this entry, you confirm the unit&apos;s eligibility within the regional command. An onboarding notification will be sent to the SPOC&apos;s email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-hairline flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-hairline text-ink-navy hover:bg-paper transition-colors font-sans text-xs uppercase font-bold tracking-wider rounded disabled:opacity-50"
                >
                  Cancel Entry
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-ink-navy text-paper hover:bg-ink-navy/90 transition-colors font-sans text-xs uppercase font-bold tracking-wider rounded shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></span>
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <span>Authorize Unit</span>
                  )}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
