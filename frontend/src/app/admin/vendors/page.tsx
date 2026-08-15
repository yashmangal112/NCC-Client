"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface SkuRow {
  id: string;
  sku: string;
  skuId: string;
  classification: string;
  price: string;
  qty: string;
  isCollapsed?: boolean;
}

export interface CatalogSku {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  costPrice: number;
  quantity?: number;
}

export interface Vendor {
  id: string;
  vendorCode?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  skusCount: number;
  skusList?: SkuRow[];
}

const CLASSIFICATIONS = [
  "Beverages",
  "Medical",
  "Rations",
  "Packaging",
  "Stationery",
];

// -------------------------------------------------------------------
// GAP-SAFE SKU CODE GENERATOR (Format: SKU-2026-001)
// -------------------------------------------------------------------
function generateNextSkuCode(catalogSkus: CatalogSku[], currentRows: SkuRow[]): string {
  const currentYear = new Date().getFullYear();
  let maxNum = 0;

  // Scan catalog SKUs for highest numeric index
  catalogSkus.forEach((s) => {
    const codeStr = s.skuCode || s.id || "";
    const matches = codeStr.match(/\d+/g);
    if (matches && matches.length > 0) {
      const val = parseInt(matches[matches.length - 1], 10);
      if (val > maxNum) maxNum = val;
    }
  });

  // Scan side panel current rows for highest numeric index
  currentRows.forEach((r) => {
    const codeStr = r.skuId || "";
    const matches = codeStr.match(/\d+/g);
    if (matches && matches.length > 0) {
      const val = parseInt(matches[matches.length - 1], 10);
      if (val > maxNum) maxNum = val;
    }
  });

  const nextNum = maxNum + 1;
  return `SKU-${currentYear}-${String(nextNum).padStart(3, "0")}`;
}

// -------------------------------------------------------------------
// COLLAPSIBLE SKU SLAB / ACCORDION CARD COMPONENT
// -------------------------------------------------------------------
function SkuCardComponent({
  row,
  index,
  catalogSkus,
  currentRows,
  onChange,
  onRemove,
  showRemove,
}: {
  row: SkuRow;
  index: number;
  catalogSkus: CatalogSku[];
  currentRows: SkuRow[];
  onChange: (id: string, field: keyof SkuRow, value: any) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}) {
  const isCollapsed = Boolean(row.isCollapsed);

  return (
    <div className="bg-white border-2 border-[#E2DCC8] rounded-lg overflow-hidden shadow-sm hover:border-[#C98A3D] transition-all font-sans">
      {/* COLLAPSIBLE SLAB ACCORDION HEADER */}
      <div
        onClick={() => onChange(row.id, "isCollapsed", !isCollapsed)}
        className="px-4 py-3 bg-[#F9F7F0] border-b border-[#E2DCC8] flex items-center justify-between cursor-pointer select-none hover:bg-[#F6F4EC] transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
          <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold font-data-mono flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          <span className="font-bold text-xs text-[#1A1A1A] font-sans truncate">
            {row.sku || `SKU Item #${index + 1} (Enter Name)`}
          </span>

          {/* Quick Summary Badges in Header */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-auto">
            {row.skuId && (
              <span className="px-2 py-0.5 bg-white border border-[#E2DCC8] rounded text-[10px] font-data-mono font-bold text-[#C98A3D]">
                {row.skuId}
              </span>
            )}
            {row.classification && (
              <span className="px-2 py-0.5 bg-white border border-[#E2DCC8] rounded text-[10px] font-bold text-[#374151]">
                {row.classification}
              </span>
            )}
            {row.price && (
              <span className="px-2 py-0.5 bg-white border border-[#E2DCC8] rounded text-[10px] font-data-mono font-bold text-[#1A1A1A]">
                ₹{row.price}
              </span>
            )}
            {row.qty && (
              <span className="px-2 py-0.5 bg-white border border-[#E2DCC8] rounded text-[10px] font-data-mono font-bold text-[#6B7280]">
                {row.qty} units
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Remove & Collapse/Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {showRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(row.id);
              }}
              className="p-1 text-[#6B7280] hover:text-[#B91C1C] rounded transition-colors cursor-pointer"
              title="Remove SKU Item"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          )}

          <span className="material-symbols-outlined text-[#1A1A1A] text-lg">
            {isCollapsed ? "expand_more" : "expand_less"}
          </span>
        </div>
      </div>

      {/* EXPANDABLE CARD BODY FIELDS */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 bg-white font-sans">
          {/* Row 1: SKU Name & Auto SKU Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8">
              <label className="block text-[11px] uppercase font-bold text-[#374151] tracking-wider mb-1">
                SKU Item Name *
              </label>
              <input
                type="text"
                required
                value={row.sku}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(row.id, "sku", val);
                  if (!row.skuId || !row.skuId.startsWith("SKU-")) {
                    onChange(row.id, "skuId", generateNextSkuCode(catalogSkus, currentRows));
                  }
                }}
                placeholder="e.g. Glucose Biscuits Pack (100g)"
                className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] font-bold focus:outline-none focus:border-[#C98A3D]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] uppercase font-bold text-[#374151] tracking-wider mb-1">
                SKU Code
              </label>
              <div className="px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-[#F6F4EC] text-[#C98A3D] font-data-mono font-bold">
                {row.skuId || generateNextSkuCode(catalogSkus, currentRows)}
              </div>
            </div>
          </div>

          {/* Row 2: Category, Price & Stock Quantity Inputs Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Classification Dropdown (Hardcoded 5 Categories) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">
                Category *
              </label>
              <select
                value={row.classification || "Beverages"}
                onChange={(e) => onChange(row.id, "classification", e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] font-semibold focus:outline-none focus:border-[#C98A3D] cursor-pointer"
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price (₹) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">
                Unit Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs font-data-mono font-bold">
                  ₹
                </span>
                <input
                  type="text"
                  value={row.price}
                  onChange={(e) => onChange(row.id, "price", e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-6 pr-2 py-1.5 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] font-data-mono font-bold focus:outline-none focus:border-[#C98A3D]"
                />
              </div>
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1">
                Initial Stock Qty
              </label>
              <input
                type="text"
                value={row.qty}
                onChange={(e) => onChange(row.id, "qty", e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] font-data-mono font-bold text-center focus:outline-none focus:border-[#C98A3D]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// MAIN VENDOR MASTER PAGE
// -------------------------------------------------------------------
export default function VendorMasterPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [catalogSkus, setCatalogSkus] = useState<CatalogSku[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slide-Over Side Panel Open State
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // View Supplied SKUs Modal State
  const [viewingVendorSkus, setViewingVendorSkus] = useState<Vendor | null>(null);

  // Vendor Details Form State
  const [form, setForm] = useState({
    vendorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  // Dynamic SKUs List in Vendor Form (Allows 0 SKUs)
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);

  // Load Vendors and SKUs strictly via authFetch API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        authFetch("/api/admin/vendors"),
        authFetch("/api/admin/skus"),
      ]);

      if (vRes.ok) {
        const json = await vRes.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: Vendor[] = json.data.map((v: any) => ({
            id: v.id,
            vendorCode: v.vendorCode || v.code,
            name: v.name || v.vendorName,
            contactPerson: v.contactPerson || v.contact || "—",
            phone: v.phone || "—",
            email: v.email || "",
            address: v.address || "",
            skusCount: v.skusCount ?? (Array.isArray(v.skusList) ? v.skusList.length : 0),
            skusList: Array.isArray(v.skusList) ? v.skusList : [],
          }));
          setVendors(mapped);
        }
      }

      if (sRes.ok) {
        const sJson = await sRes.json();
        if (sJson.success && Array.isArray(sJson.data)) {
          const mappedSkus: CatalogSku[] = sJson.data.map((s: any) => ({
            id: s.id,
            skuCode: s.skuCode || s.code || s.id,
            name: s.name,
            category: s.category || "Beverages",
            costPrice: s.costPrice || s.price || 0,
            quantity: s.quantity || s.qty || 0,
          }));
          setCatalogSkus(mappedSkus);
        }
      }
    } catch (err) {
      console.error("Error loading vendor master API data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Vendor Panel
  const handleOpenCreatePanel = () => {
    setEditingVendorId(null);
    setForm({
      vendorName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
    setSkuRows([
      {
        id: `r-${Date.now()}`,
        sku: "",
        skuId: generateNextSkuCode(catalogSkus, []),
        classification: "Beverages",
        price: "",
        qty: "",
        isCollapsed: false,
      },
    ]);
    setPanelOpen(true);
  };

  // Open Edit Vendor Panel
  const handleOpenEditPanel = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setForm({
      vendorName: vendor.name,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email || "",
      address: vendor.address || "",
    });

    if (vendor.skusList && vendor.skusList.length > 0) {
      // Collapse previous rows by default for clean UX
      setSkuRows(vendor.skusList.map((r) => ({ ...r, isCollapsed: true })));
    } else {
      setSkuRows([
        {
          id: `r-${Date.now()}`,
          sku: "",
          skuId: generateNextSkuCode(catalogSkus, []),
          classification: "Beverages",
          price: "",
          qty: "",
          isCollapsed: false,
        },
      ]);
    }

    setPanelOpen(true);
  };

  // Dynamic SKU Row Actions
  const updateSku = (id: string, field: keyof SkuRow, value: any) => {
    setSkuRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeSku = (id: string) => {
    setSkuRows((rows) => rows.filter((r) => r.id !== id));
  };

  const addSkuRow = () => {
    const nextCode = generateNextSkuCode(catalogSkus, skuRows);
    setSkuRows((rows) => [
      ...rows.map((r) => ({ ...r, isCollapsed: true })), // Collapse previous rows for clean UX
      {
        id: `r-${Date.now()}`,
        sku: "",
        skuId: nextCode,
        classification: "Beverages",
        price: "",
        qty: "",
        isCollapsed: false, // New row stays expanded for editing
      },
    ]);
  };

  // Save / Update Vendor Action
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.vendorName.trim()) {
      alert("Please enter the Vendor Name.");
      return;
    }
    if (!form.contactPerson.trim()) {
      alert("Please enter the Contact Person name.");
      return;
    }
    if (!form.phone.trim()) {
      alert("Please enter a valid contact Phone Number.");
      return;
    }

    setSubmitting(true);

    const validSkus = skuRows.filter((r) => r.sku.trim().length > 0);

    const payload = {
      name: form.vendorName,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      address: form.address,
      skusList: validSkus,
    };

    try {
      const isEdit = Boolean(editingVendorId);
      const url = isEdit ? `/api/admin/vendors/${editingVendorId}` : "/api/admin/vendors";
      const method = isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
      } else {
        // Optimistic update
        if (isEdit) {
          setVendors((prev) =>
            prev.map((v) =>
              v.id === editingVendorId
                ? {
                    ...v,
                    name: form.vendorName,
                    contactPerson: form.contactPerson,
                    phone: form.phone,
                    email: form.email,
                    address: form.address,
                    skusCount: validSkus.length,
                    skusList: validSkus,
                  }
                : v
            )
          );
        } else {
          const newVendor: Vendor = {
            id: `v-${Date.now()}`,
            vendorCode: `VEN-00${vendors.length + 1}`,
            name: form.vendorName,
            contactPerson: form.contactPerson,
            phone: form.phone,
            email: form.email,
            address: form.address,
            skusCount: validSkus.length,
            skusList: validSkus,
          };
          setVendors([newVendor, ...vendors]);
        }
      }
    } catch (err) {
      console.error("Save Vendor error:", err);
    } finally {
      setSubmitting(false);
      setPanelOpen(false);
    }
  };

  // Filtered Vendors based on Search Query
  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      (v.address && v.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative flex min-h-screen bg-[#F6F4EC] font-sans overflow-hidden">
      {/* MASTER BACKDROP CANVAS */}
      <div
        className="flex-1 transition-all duration-300 flex flex-col min-h-screen"
        style={{
          filter: panelOpen || viewingVendorSkus ? "brightness(0.96)" : "none",
          transform: panelOpen ? "scale(0.994)" : "scale(1)",
          transformOrigin: "left center",
        }}
      >
        {/* Page Header */}
        <div className="px-8 pt-7 pb-4">
          <p className="text-xs text-[#6B7280] uppercase tracking-widest font-medium mb-1">
            Vendor Management
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            Vendor Master
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5 font-medium">
            Manage approved suppliers, SKU mappings, and inventory stock quantities
          </p>
        </div>

        {/* Toolbar */}
        <div className="px-8 pb-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 max-w-sm relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name, contact, address..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C98A3D]"
            />
          </div>

          <div className="ml-auto">
            <button
              onClick={handleOpenCreatePanel}
              className="px-4 py-2 bg-[#C98A3D] hover:bg-[#B57A30] text-white text-sm font-semibold rounded transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {/* Master Vendor Table */}
        <div className="px-8 pb-8 flex-1">
          <div className="border border-[#E2DCC8] rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-[#F6F4EC] border-b border-[#E2DCC8]">
                    <th className="px-4 py-3.5 font-semibold text-[#374151] text-xs uppercase tracking-wide">
                      Vendor Name
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-[#374151] text-xs uppercase tracking-wide">
                      Contact Person
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-[#374151] text-xs uppercase tracking-wide">
                      Phone
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-[#374151] text-xs uppercase tracking-wide">
                      Address
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-[#374151] text-xs uppercase tracking-wide text-center">
                      Supplied SKUs
                    </th>
                    <th className="px-4 py-3.5 text-right font-semibold text-[#374151] text-xs uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE3]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6B7280] italic text-sm">
                        Loading vendor register...
                      </td>
                    </tr>
                  ) : filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6B7280] italic text-sm">
                        No vendors found in master directory. Click &quot;+ Add Vendor&quot; to register a supplier.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FDFCF8] transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#1A1A1A] font-sans">
                          {row.name}
                        </td>
                        <td className="px-4 py-3.5 text-[#374151] font-medium">{row.contactPerson}</td>
                        <td className="px-4 py-3.5 text-[#6B7280] font-data-mono text-xs font-semibold">
                          {row.phone}
                        </td>
                        <td className="px-4 py-3.5 text-[#374151] font-medium">{row.address || "—"}</td>
                        <td className="px-4 py-3.5 text-center">
                          {/* Supplied SKUs Badge with Information Info Icon (i) */}
                          <div className="inline-flex items-center gap-1.5 bg-[#F6F4EC] border border-[#E2DCC8] rounded px-2.5 py-1">
                            <span className="font-data-mono text-xs font-bold text-[#C98A3D]">
                              {row.skusCount} SKUs
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingVendorSkus(row)}
                              className="w-5 h-5 rounded-full bg-white hover:bg-[#C98A3D] text-[#C98A3D] hover:text-white border border-[#E2DCC8] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              title="View Supplied SKUs Inventory"
                            >
                              <span className="material-symbols-outlined text-[13px]">info</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditPanel(row)}
                            className="text-xs text-[#C98A3D] hover:underline font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-3 px-1 font-medium">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </p>
        </div>
      </div>

      {/* VIEW SUPPLIED SKUS MODAL DIALOG */}
      {viewingVendorSkus && (
        <>
          <div
            onClick={() => setViewingVendorSkus(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
          ></div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-[#E2DCC8] max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#F6F4EC] border-b border-[#E2DCC8] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C98A3D] text-xl">inventory_2</span>
                    <h3 className="font-bold text-lg text-[#1A1A1A]">
                      {viewingVendorSkus.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    Supplied SKUs Register ({viewingVendorSkus.skusList?.length || 0} items mapped)
                  </p>
                </div>
                <button
                  onClick={() => setViewingVendorSkus(null)}
                  className="w-8 h-8 rounded-full hover:bg-[#E2DCC8] text-[#6B7280] hover:text-[#1A1A1A] flex items-center justify-center text-xl cursor-pointer transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Modal Content Table */}
              <div className="p-6 overflow-y-auto flex-1">
                {!viewingVendorSkus.skusList || viewingVendorSkus.skusList.length === 0 ? (
                  <div className="py-12 text-center text-[#6B7280] italic text-sm border-2 border-dashed border-[#E2DCC8] rounded-lg">
                    No SKUs currently mapped to this vendor.
                  </div>
                ) : (
                  <div className="border border-[#E2DCC8] rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-[#F6F4EC] border-b border-[#E2DCC8]">
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide w-10 text-center">
                            #
                          </th>
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide">
                            SKU Item Name
                          </th>
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide">
                            SKU Code
                          </th>
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide">
                            Category
                          </th>
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide text-right">
                            Unit Rate
                          </th>
                          <th className="px-3.5 py-2.5 font-semibold text-[#374151] uppercase tracking-wide text-center">
                            Stock Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EDE3]">
                        {viewingVendorSkus.skusList.map((skuItem, idx) => (
                          <tr key={skuItem.id || idx} className="hover:bg-[#FDFCF8]">
                            <td className="px-3.5 py-2.5 text-center font-bold text-[#6B7280]">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-[#1A1A1A]">
                              {skuItem.sku || "—"}
                            </td>
                            <td className="px-3.5 py-2.5 font-data-mono font-bold text-[#C98A3D]">
                              {skuItem.skuId || "—"}
                            </td>
                            <td className="px-3.5 py-2.5 font-semibold text-[#374151]">
                              {skuItem.classification || "—"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-data-mono font-bold text-[#1A1A1A]">
                              ₹{skuItem.price || "0.00"}
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-data-mono font-bold text-[#6B7280]">
                              {skuItem.qty || "0"} units
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#F6F4EC] border-t border-[#E2DCC8] flex justify-end">
                <button
                  onClick={() => setViewingVendorSkus(null)}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#374151] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DIM OVERLAY WHEN SIDE PANEL IS OPEN */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          className="fixed inset-0 bg-black/20 z-20 transition-opacity"
        ></div>
      )}

      {/* SPACIOUS SLIDE-OVER SIDE PANEL (640px WIDE) */}
      <div
        className="fixed top-0 right-0 h-full z-30 flex flex-col bg-white font-sans transition-transform duration-300 ease-in-out"
        style={{
          width: "640px",
          maxWidth: "100vw",
          borderLeft: "1px solid #E2DCC8",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: panelOpen ? "-8px 0 32px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Panel Header */}
        <div className="flex items-start justify-between px-8 pt-6 pb-5 flex-shrink-0 border-b border-[#F0EDE3]">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] leading-tight font-headline">
              {editingVendorId ? "Edit Vendor Profile" : "Add New Vendor"}
            </h2>
            <p className="text-xs text-[#C98A3D] uppercase tracking-widest mt-0.5 font-bold">
              {editingVendorId ? "Update Vendor & SKU Mapping" : "Supplier Registration & SKU Inventory Assignment"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F6F4EC] hover:text-[#1A1A1A] transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Form */}
        <form onSubmit={handleSaveVendor} className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
          {/* Section 1 — Vendor Details */}
          <div className="bg-[#FDFCF8] border border-[#E2DCC8] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] border-b border-[#E2DCC8] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C98A3D] text-lg">domain</span>
              <span>Section 1 — Vendor Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.vendorName}
                  onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
                  placeholder="e.g. Kamla Enterprises"
                  className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#B8AE96] focus:outline-none focus:border-[#C98A3D] font-bold"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={form.contactPerson}
                  onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#B8AE96] focus:outline-none focus:border-[#C98A3D]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#B8AE96] focus:outline-none focus:border-[#C98A3D] font-data-mono font-bold"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="vendor@domain.com"
                  className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#B8AE96] focus:outline-none focus:border-[#C98A3D]"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                Registered Address / City
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Complete registered business address..."
                className="w-full px-3 py-2 text-xs border border-[#E2DCC8] rounded bg-white text-[#1A1A1A] placeholder-[#B8AE96] focus:outline-none focus:border-[#C98A3D] resize-none"
              ></textarea>
            </div>
          </div>

          {/* Section 2 — SKUs Supplied by This Vendor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2DCC8] pb-2">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C98A3D] text-lg">inventory_2</span>
                <span>Section 2 — SKUs Supplied by Vendor ({skuRows.filter((r) => r.sku).length})</span>
              </h3>
              <span className="text-[11px] text-[#6B7280] italic font-medium">
                (Optional — Can save vendor with 0 SKUs)
              </span>
            </div>

            {/* SKU Builder Cards List (Collapsible Accordion Slabs) */}
            <div className="space-y-3.5">
              {skuRows.map((row, idx) => (
                <SkuCardComponent
                  key={row.id}
                  row={row}
                  index={idx}
                  catalogSkus={catalogSkus}
                  currentRows={skuRows}
                  onChange={updateSku}
                  onRemove={removeSku}
                  showRemove={skuRows.length > 1}
                />
              ))}
            </div>

            {/* Add Another SKU Button */}
            <button
              type="button"
              onClick={addSkuRow}
              className="w-full py-3 bg-[#F6F4EC] hover:bg-[#E2DCC8] text-[#C98A3D] hover:text-[#B57A30] font-bold text-xs uppercase tracking-wider rounded-lg border-2 border-dashed border-[#E2DCC8] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>+ Add Another SKU Item</span>
            </button>
          </div>

          {/* Panel Footer Action Buttons */}
          <div className="pt-4 border-t border-[#E2DCC8] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-4 z-10">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-[#5C6B72] hover:text-[#1A1A1A] hover:bg-[#F6F4EC] rounded transition-colors uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#C98A3D] hover:bg-[#B57A30] rounded shadow-md transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{submitting ? "Saving Vendor..." : "Save Vendor"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
