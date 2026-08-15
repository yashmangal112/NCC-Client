"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface UnitAllocation {
  unitName: string;
  studentCount: number;
}

export interface SchoolItem {
  id: string; // Unique Institutional Code (e.g., NCC-SC-00101)
  name: string;
  address: string;
  unitAllocations: UnitAllocation[]; // Mapped to multiple units with cadet counts
  headName: string;
  headDesignation: string;
  headEmail: string;
  headPhone: string;
  lifetimeOrders: number;
  lifetimeRevenue: number;
}


export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("All Units");

  // View state: "list" or "add-form"
  const [viewMode, setViewMode] = useState<"list" | "add-form">("list");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCertified, setIsCertified] = useState<boolean>(false);

  // Administrative log timestamp
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const format =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        " " +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");
      setTimestamp(format);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------------
  // API INTEGRATION: FETCH SCHOOLS & UNITS (authFetch GET /api/admin/schools)
  // -------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Schools via authFetch
      const res = await authFetch("/api/admin/schools");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: SchoolItem[] = json.data.map((s: any) => ({
            id: s.schoolCode || s.id,
            name: s.name,
            address: s.address || "Address on File",
            unitAllocations: s.unitAllocations || [
              { unitName: "4 Delhi BN NCC", studentCount: s.studentCount || 50 },
            ],
            headName: s.headName || "Principal Officer",
            headDesignation: s.headDesignation || "Principal",
            headEmail: s.headEmail || "school@delhi.edu",
            headPhone: s.headPhone || "+91-98000-00000",
            lifetimeOrders: s.lifetimeOrders || 0,
            lifetimeRevenue: s.lifetimeRevenue || 0.0,
          }));
          setSchools(mapped);
        }
      }

      // 2. Fetch Units for dropdown options via authFetch
      const unitRes = await authFetch("/api/admin/units");
      if (unitRes.ok) {
        const unitJson = await unitRes.json();
        if (unitJson.success && Array.isArray(unitJson.data) && unitJson.data.length > 0) {
          const names: string[] = unitJson.data.map((u: any) => u.name);
          setAvailableUnits(names);
        }
      }
    } catch (err) {
      console.warn("Backend API not reached via authFetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add School Form State
  const [formData, setFormData] = useState({
    schoolName: "",
    address: "",
    institutionalCode: "",
    headName: "",
    headDesignation: "Principal",
    headEmail: "",
    headPhone: "",
    password: "",
  });

  // Multiple Unit Allocation Form State
  const [formUnitAllocations, setFormUnitAllocations] = useState<UnitAllocation[]>([
    { unitName: "4 Delhi BN NCC", studentCount: 10 },
  ]);

  const handleAddUnitAllocation = () => {
    const defaultUnit = availableUnits[0] || "7 Delhi BN NCC";
    setFormUnitAllocations([
      ...formUnitAllocations,
      { unitName: defaultUnit, studentCount: 10 },
    ]);
  };

  const handleRemoveUnitAllocation = (index: number) => {
    if (formUnitAllocations.length === 1) return;
    const updated = [...formUnitAllocations];
    updated.splice(index, 1);
    setFormUnitAllocations(updated);
  };

  const handleUpdateUnitAllocation = (
    index: number,
    field: "unitName" | "studentCount",
    val: string | number
  ) => {
    const updated = [...formUnitAllocations];
    if (field === "unitName") {
      updated[index].unitName = val as string;
    } else {
      updated[index].studentCount = Math.max(1, Number(val) || 0);
    }
    setFormUnitAllocations(updated);
  };

  // Filtered Schools List
  const filteredSchools = schools.filter((sch) => {
    const matchesSearch =
      sch.name.toLowerCase().includes(search.toLowerCase()) ||
      sch.id.toLowerCase().includes(search.toLowerCase()) ||
      sch.headName.toLowerCase().includes(search.toLowerCase());

    const matchesUnit =
      selectedUnitFilter === "All Units" ||
      sch.unitAllocations.some((alloc) => alloc.unitName === selectedUnitFilter);

    return matchesSearch && matchesUnit;
  });

  // -------------------------------------------------------------------
  // API INTEGRATION: CREATE SCHOOL (authFetch POST /api/admin/schools)
  // -------------------------------------------------------------------
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCertified) {
      alert("Please certify the record entry by checking the verification box.");
      return;
    }

    if (!formData.schoolName || !formData.headName || !formData.headEmail) {
      alert("Please fill in the required school name and head details.");
      return;
    }

    setSubmitting(true);

    const autoCode =
      formData.institutionalCode.trim().toUpperCase() ||
      `NCC-SC-00${100 + schools.length + 1}`;

    const payload = {
      schoolCode: autoCode,
      name: formData.schoolName,
      address: formData.address || "Address on File",
      headName: formData.headName,
      headDesignation: formData.headDesignation || "Principal",
      headEmail: formData.headEmail,
      headPhone: formData.headPhone || "+91-98000-00000",
      password: formData.password || "TemporaryPass123!",
      unitAllocations: formUnitAllocations,
    };

    try {
      const res = await authFetch("/api/admin/schools", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
      } else {
        // Fallback optimistic update
        const newSchool: SchoolItem = {
          id: autoCode,
          name: formData.schoolName,
          address: formData.address || "Address on File",
          unitAllocations: formUnitAllocations,
          headName: formData.headName,
          headDesignation: formData.headDesignation || "Principal",
          headEmail: formData.headEmail,
          headPhone: formData.headPhone || "+91-98000-00000",
          lifetimeOrders: 0,
          lifetimeRevenue: 0.0,
        };
        setSchools([newSchool, ...schools]);
      }
    } catch (err) {
      console.error("Create School API error, applying local state update:", err);
      const newSchool: SchoolItem = {
        id: autoCode,
        name: formData.schoolName,
        address: formData.address || "Address on File",
        unitAllocations: formUnitAllocations,
        headName: formData.headName,
        headDesignation: formData.headDesignation || "Principal",
        headEmail: formData.headEmail,
        headPhone: formData.headPhone || "+91-98000-00000",
        lifetimeOrders: 0,
        lifetimeRevenue: 0.0,
      };
      setSchools([newSchool, ...schools]);
    } finally {
      setSubmitting(false);
      setViewMode("list");
      setFormData({
        schoolName: "",
        address: "",
        institutionalCode: "",
        headName: "",
        headDesignation: "Principal",
        headEmail: "",
        headPhone: "",
        password: "",
      });
      setFormUnitAllocations([{ unitName: availableUnits[0] || "4 Delhi BN NCC", studentCount: 10 }]);
      setIsCertified(false);
    }
  };

  return (
    <div className="p-container-padding flex-1 bg-paper/30 font-sans">
      {/* View 1: Schools Directory List */}
      {viewMode === "list" && (
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
                Schools
              </h1>
              <p className="font-sans text-sm text-steel mt-1">
                Institutional Directory &amp; Multi-Unit Cadet Allocations
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-brass font-data-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
                  Syncing Schools API...
                </span>
              )}
              <button
                onClick={() => setViewMode("add-form")}
                className="bg-brass hover:bg-brass/90 text-white font-bold px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest font-sans"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add School
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-hairline p-4 rounded flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="relative flex-1 min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search by school name, code, or school head..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper/30 border border-hairline rounded pl-10 pr-4 py-2 text-sm text-ink-navy focus:outline-none focus:border-brass font-sans"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-sans text-xs font-bold text-steel uppercase">
                Filter by Mapped Unit:
              </span>
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="bg-white border border-hairline rounded px-3 py-2 text-xs font-sans font-semibold text-ink-navy focus:outline-none focus:border-brass"
              >
                <option value="All Units">All Units</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Ledger Table */}
          <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
              <span className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
                Institutional Directory ({filteredSchools.length} Schools)
              </span>
              <span className="text-xs text-steel font-sans italic">
                Note: A school can be mapped to multiple administrative units with cadet allocations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-ink-navy">
                    <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                      School Code &amp; Name
                    </th>
                    <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                      Mapped Units &amp; Cadet Allocations
                    </th>
                    <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                      School Head &amp; Contact
                    </th>
                    <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider text-center">
                      Lifetime Orders
                    </th>
                    <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider text-right">
                      Lifetime Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-steel italic font-sans">
                        No schools found matching your search and unit filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((sch) => {
                      const totalCadets = sch.unitAllocations.reduce(
                        (acc, i) => acc + i.studentCount,
                        0
                      );
                      return (
                        <tr
                          key={sch.id}
                          className="hover:bg-paper/40 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-data-mono text-xs font-bold text-brass">
                                {sch.id}
                              </span>
                              <span className="font-sans font-semibold text-ink-navy text-sm mt-0.5">
                                {sch.name}
                              </span>
                              <span className="text-xs text-steel line-clamp-1 mt-0.5 font-sans">
                                {sch.address}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {sch.unitAllocations.map((alloc, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-ink-navy/10 text-ink-navy border border-ink-navy/20 rounded text-xs font-bold font-sans flex items-center gap-1.5"
                                >
                                  <span>{alloc.unitName}</span>
                                  <span className="bg-brass/20 text-brass px-1.5 py-0.5 rounded text-[10px] font-data-mono">
                                    {alloc.studentCount} Cadets
                                  </span>
                                </span>
                              ))}
                              <span className="text-[11px] font-data-mono text-steel font-bold ml-1">
                                (Total: {totalCadets})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans">
                            <p className="font-semibold text-xs text-ink-navy">
                              {sch.headName}{" "}
                              <span className="font-normal text-steel">
                                ({sch.headDesignation})
                              </span>
                            </p>
                            <p className="text-xs text-steel italic mt-0.5 font-data-mono">
                              {sch.headEmail} • {sch.headPhone}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center font-data-mono font-bold text-sm text-ink-navy">
                            {sch.lifetimeOrders} Orders
                          </td>
                          <td className="px-6 py-4 text-right font-data-mono font-bold text-sm text-settled-green">
                            ₹
                            {sch.lifetimeRevenue.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Add New School Form Container */}
      {viewMode === "add-form" && (
        <div className="max-w-4xl mx-auto space-y-6 font-sans">
          {/* Breadcrumb & Header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-steel font-sans text-xs uppercase tracking-wider mb-2 font-bold">
                <button
                  onClick={() => setViewMode("list")}
                  className="hover:text-brass transition-colors"
                >
                  Directory
                </button>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <button
                  onClick={() => setViewMode("list")}
                  className="hover:text-brass transition-colors"
                >
                  Schools
                </button>
              </div>
              <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-ink-navy">
                Add New School
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setViewMode("list")}
                className="px-5 py-2 border border-hairline bg-white text-ink-navy hover:bg-paper transition-colors rounded text-xs font-sans uppercase font-bold tracking-wider disabled:opacity-50"
              >
                Cancel Entry
              </button>
            </div>
          </div>

          {/* Ledger Form Card Container */}
          <div className="bg-white border border-hairline shadow-sm overflow-hidden relative rounded">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brass"></div>

            <form onSubmit={handleCreateSchool} className="p-6 md:p-8 space-y-8 font-sans">
              {/* Section 1: Institution Details */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 border-b border-hairline pb-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-paper border border-hairline font-data-mono text-xs text-brass font-bold">
                    01
                  </span>
                  <h3 className="font-sans text-xs uppercase font-bold tracking-wider text-ink-navy flex-1">
                    Institution Identification &amp; Unit Mapping
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full legal name of the institution (e.g. GBSSS Molarband)"
                      value={formData.schoolName}
                      onChange={(e) =>
                        setFormData({ ...formData, schoolName: e.target.value })
                      }
                      className="w-full bg-white border border-hairline focus:border-brass focus:outline-none text-sm p-3 rounded text-ink-navy"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Physical Address
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Complete institutional street address, block, and district"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full bg-white border border-hairline focus:border-brass focus:outline-none text-sm p-3 rounded text-ink-navy"
                    ></textarea>
                  </div>

                  {/* Multi-Unit Mapping Sub-section */}
                  <div className="space-y-3 col-span-2 bg-paper/40 p-4 rounded border border-hairline">
                    <div className="flex justify-between items-center">
                      <label className="font-sans text-xs uppercase font-bold text-ink-navy block">
                        Mapped Administrative Units &amp; Cadet Allocations *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddUnitAllocation}
                        className="text-xs text-brass hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Unit Mapping
                      </button>
                    </div>
                    <p className="text-[11px] text-steel italic">
                      A school can be mapped to multiple administrative Units with cadet allocations per unit (e.g., 10 cadets in Unit A, 20 in Unit B).
                    </p>

                    <div className="space-y-3 pt-2">
                      {formUnitAllocations.map((alloc, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded border border-hairline"
                        >
                          <div className="flex-1 w-full">
                            <label className="text-[10px] text-steel uppercase font-bold block mb-1">
                              Select Unit #{idx + 1}
                            </label>
                            <select
                              value={alloc.unitName}
                              onChange={(e) =>
                                handleUpdateUnitAllocation(
                                  idx,
                                  "unitName",
                                  e.target.value
                                )
                              }
                              className="w-full bg-white border border-hairline text-xs p-2 rounded text-ink-navy focus:outline-none focus:border-brass"
                            >
                              {availableUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full sm:w-40">
                            <label className="text-[10px] text-steel uppercase font-bold block mb-1">
                              Cadets Enrolled
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={alloc.studentCount}
                              onChange={(e) =>
                                handleUpdateUnitAllocation(
                                  idx,
                                  "studentCount",
                                  e.target.value
                                )
                              }
                              className="w-full bg-white border border-hairline text-xs p-2 rounded text-ink-navy font-data-mono focus:outline-none focus:border-brass"
                            />
                          </div>

                          {formUnitAllocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUnitAllocation(idx)}
                              className="text-steel hover:text-alert-rust p-1 sm:mt-4"
                              title="Remove mapping"
                            >
                              <span className="material-symbols-outlined text-lg">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Institutional Code (Unique ID)
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. NCC-SC-00${100 + schools.length + 1}`}
                      value={formData.institutionalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          institutionalCode: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-hairline focus:border-brass focus:outline-none font-data-mono text-sm p-3 rounded text-ink-navy uppercase"
                    />
                  </div>
                </div>
              </section>

              <div className="perforation h-px w-full"></div>

              {/* Section 2: School Head Details */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 border-b border-hairline pb-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-paper border border-hairline font-data-mono text-xs text-brass font-bold">
                    02
                  </span>
                  <h3 className="font-sans text-xs uppercase font-bold tracking-wider text-ink-navy flex-1">
                    Primary Administrator (School Head) Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Full Name of School Head *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                        person
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Firstname Lastname"
                        value={formData.headName}
                        onChange={(e) =>
                          setFormData({ ...formData, headName: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-hairline focus:border-brass focus:outline-none text-sm rounded text-ink-navy"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Official Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Principal, Rector"
                      value={formData.headDesignation}
                      onChange={(e) =>
                        setFormData({ ...formData, headDesignation: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-hairline focus:border-brass focus:outline-none text-sm rounded text-ink-navy"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Email Address *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                        alternate_email
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="official.head@school.edu"
                        value={formData.headEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, headEmail: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-hairline focus:border-brass focus:outline-none text-sm rounded text-ink-navy"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                        call
                      </span>
                      <input
                        type="tel"
                        placeholder="+91-98765-43210"
                        value={formData.headPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, headPhone: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-hairline focus:border-brass focus:outline-none text-sm rounded text-ink-navy font-data-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="font-sans text-xs uppercase font-bold text-steel block">
                      Administrative Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Set a secure temporary password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full pl-10 pr-12 py-2.5 bg-white border border-hairline focus:border-brass focus:outline-none text-sm rounded text-ink-navy font-data-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-ink-navy text-lg"
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </button>
                    </div>
                    <p className="text-[11px] text-steel">
                      Head will be prompted to change this upon initial login.
                    </p>
                  </div>
                </div>
              </section>

              {/* Form Submission & Verification Checkbox */}
              <div className="pt-6 border-t border-hairline flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="confirm-check"
                    checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)}
                    className="rounded border-hairline text-brass focus:ring-brass w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="confirm-check"
                    className="text-steel text-xs font-sans cursor-pointer select-none"
                  >
                    I certify that these details are verified for official NCC record entry.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-ink-navy hover:bg-ink-navy/90 text-white px-8 py-3 font-sans text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 rounded shadow transition-all active:scale-98 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></span>
                      <span>Registering School...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Registration</span>
                      <span className="material-symbols-outlined text-base">
                        verified_user
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <footer className="mt-8 mb-12 flex justify-between items-center text-steel/60 font-data-mono text-[11px] uppercase">
            <div className="flex gap-4">
              <span>Logged as: Master_Admin_04</span>
              <span>•</span>
              <span>System ID: NCC-7882-X</span>
            </div>
            <div>
              Timestamp: <span>{timestamp || "2024-10-27 14:45:01"}</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
