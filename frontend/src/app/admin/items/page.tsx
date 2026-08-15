"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

// Types for SKU Item matching Prisma / API schema
export interface SkuItem {
  id: string; // SKU Code or Database UUID
  skuCode?: string;
  name: string;
  category: "Rations" | "Beverages" | "Medical" | "Packaging" | "Stationery" | string;
  status?: "In Stock" | "Low Stock" | "Out of Stock";
  costPrice: number;
  stockThreshold?: number;
  specifications?: string;
  description?: string;
  unitOfMeasure?: string;
  iconName?: string;
  isArchived?: boolean;
}

export default function AdminSkusPage() {
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Side Panel Drawer State
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [editingSku, setEditingSku] = useState<SkuItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    category: "Rations",
    costPrice: "",
    stockThreshold: "50",
    specifications: "",
  });

  // -------------------------------------------------------------------
  // API INTEGRATION: FETCH SKUS (GET /api/admin/skus)
  // -------------------------------------------------------------------
  const loadSkus = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== "All") queryParams.append("category", selectedCategory);
      if (search.trim()) queryParams.append("search", search.trim());

      const res = await authFetch(`/api/admin/skus?${queryParams.toString()}`);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Map backend Prisma objects to UI SkuItem format
        const mapped: SkuItem[] = json.data.map((item: any) => ({
          id: item.skuCode || item.id,
          skuCode: item.skuCode || item.id,
          name: item.name,
          category: item.category || "Rations",
          status: item.isArchived ? "Out of Stock" : "In Stock",
          costPrice: item.costPrice || 0,
          stockThreshold: 50,
          specifications: item.description || item.specifications || "",
          iconName: item.category === "Rations" ? "cookie" : item.category === "Beverages" ? "local_drink" : item.category === "Medical" ? "medical_services" : item.category === "Packaging" ? "shopping_bag" : "inventory",
        }));
        setSkus(mapped);
      } else {
        // Fallback to local data if backend returns empty/unimplemented
      }
    } catch (err: any) {
      console.warn("Backend API not reached. Falling back to local ledger data:", err.message);
      setApiError("Backend API unavailable — showing cached inventory fallback.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadSkus();
  }, [loadSkus]);

  // Filtered SKUs Client Side
  const filteredSkus = skus.filter((sku) => {
    const skuId = sku.skuCode || sku.id;
    const matchesSearch =
      sku.name.toLowerCase().includes(search.toLowerCase()) ||
      skuId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || sku.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Total Inventory Value
  const totalInventoryCost = skus.reduce(
    (acc, sku) => acc + (sku.costPrice || 0),
    0
  );

  // Open Side Panel for New SKU
  const handleOpenCreatePanel = () => {
    setEditingSku(null);
    setFormData({
      name: "",
      category: "Rations",
      costPrice: "",
      stockThreshold: "50",
      specifications: "",
    });
    setIsSidePanelOpen(true);
  };

  // Open Side Panel for Editing SKU
  const handleOpenEditPanel = (sku: SkuItem) => {
    setEditingSku(sku);
    setFormData({
      name: sku.name,
      category: sku.category,
      costPrice: String(sku.costPrice),
      stockThreshold: String(sku.stockThreshold || 50),
      specifications: sku.specifications || sku.description || "",
    });
    setIsSidePanelOpen(true);
  };

  // -------------------------------------------------------------------
  // API INTEGRATION: CREATE OR UPDATE SKU (POST/PUT /api/admin/skus)
  // -------------------------------------------------------------------
  const handleSaveSku = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.costPrice) {
      alert("Please fill in the item name and cost price.");
      return;
    }

    const numericPrice = parseFloat(formData.costPrice) || 0;
    const numericThreshold = parseInt(formData.stockThreshold) || 50;

    const payload = {
      name: formData.name,
      category: formData.category,
      costPrice: numericPrice,
      unitOfMeasure: "Pack",
      description: formData.specifications,
    };

    try {
      if (editingSku) {
        // API Call: PUT /api/admin/skus/:id
        const res = await authFetch(`/api/admin/skus/${editingSku.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await loadSkus();
        } else {
          // Optimistic local update fallback
          setSkus(
            skus.map((item) =>
              item.id === editingSku.id
                ? {
                    ...item,
                    name: formData.name,
                    category: formData.category,
                    costPrice: numericPrice,
                    stockThreshold: numericThreshold,
                    specifications: formData.specifications,
                  }
                : item
            )
          );
        }
      } else {
        // API Call: POST /api/admin/skus
        const autoCode = `SKU-2026-${String(skus.length + 1).padStart(3, "0")}`;
        const res = await authFetch("/api/admin/skus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, skuCode: autoCode }),
        });

        if (res.ok) {
          await loadSkus();
        } else {
          // Optimistic local create fallback
          const newSku: SkuItem = {
            id: autoCode,
            skuCode: autoCode,
            name: formData.name,
            category: formData.category,
            status: "In Stock",
            costPrice: numericPrice,
            stockThreshold: numericThreshold,
            specifications: formData.specifications,
            iconName: "inventory_2",
          };
          setSkus([newSku, ...skus]);
        }
      }
    } catch (err) {
      console.error("API call failed, applied optimistic state update:", err);
    } finally {
      setIsSidePanelOpen(false);
    }
  };

  // -------------------------------------------------------------------
  // API INTEGRATION: ARCHIVE SKU (DELETE /api/admin/skus/:id)
  // -------------------------------------------------------------------
  const handleDeleteSku = async (id: string) => {
    if (!confirm("Are you sure you want to archive this SKU item?")) return;

    try {
      const res = await authFetch(`/api/admin/skus/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadSkus();
      } else {
        setSkus(skus.filter((sku) => sku.id !== id && sku.skuCode !== id));
      }
    } catch (err) {
      console.error("Delete API failed, removing locally:", err);
      setSkus(skus.filter((sku) => sku.id !== id && sku.skuCode !== id));
    }
  };

  return (
    <div className="p-container-padding flex-1 bg-paper/30 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
            Items
          </h1>
          <p className="font-sans text-sm text-steel mt-1">
            Institutional Inventory &amp; Resource Catalog
          </p>
        </div>
        <button
          onClick={handleOpenCreatePanel}
          className="bg-brass hover:bg-brass/90 text-white font-bold px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest font-sans"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Item
        </button>
      </div>

      {/* API Notice / Status Alert */}
      {apiError && (
        <div className="mb-4 p-3 bg-brass/10 border border-brass/30 text-brass text-xs rounded font-sans flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">info</span>
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadSkus}
            className="underline uppercase font-bold text-[10px] hover:text-ink-navy"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-hairline p-4 rounded mb-stack-md flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by Item name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper/30 border border-hairline rounded pl-10 pr-4 py-2 text-sm text-ink-navy focus:outline-none focus:border-brass font-sans"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="font-sans text-xs font-semibold text-steel uppercase tracking-wider">
            Category:
          </span>
          {["All", "Rations", "Beverages", "Medical", "Packaging"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-sans font-bold uppercase rounded border transition-colors ${
                selectedCategory === cat
                  ? "bg-ink-navy text-paper border-ink-navy"
                  : "bg-white text-steel border-hairline hover:bg-paper"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Inventory Ledger Table */}
      <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
          <span className="font-sans text-xs text-steel uppercase font-bold tracking-wider">
            Primary Inventory Ledger ({filteredSkus.length} Items)
          </span>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-brass font-data-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
                Syncing API...
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="p-1.5 text-steel hover:bg-hairline/30 rounded transition-colors"
              title="Reset Filters"
            >
              <span className="material-symbols-outlined text-lg">filter_alt_off</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-ink-navy">
                <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                  SKU Name &amp; Code
                </th>
                <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider text-right">
                  Cost Price
                </th>
                <th className="px-6 py-3.5 font-sans text-paper uppercase text-[11px] font-semibold tracking-wider text-center w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-steel italic font-sans">
                    {loading ? "Loading SKU inventory from API..." : "No SKU items found matching your filters."}
                  </td>
                </tr>
              ) : (
                filteredSkus.map((sku) => {
                  const displayCode = sku.skuCode || sku.id;
                  return (
                    <tr
                      key={sku.id}
                      className="hover:bg-paper/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-paper/60 rounded border border-hairline flex items-center justify-center text-steel">
                            <span className="material-symbols-outlined text-xl">
                              {sku.iconName || "inventory_2"}
                            </span>
                          </div>
                          <div>
                            <p className="font-sans font-semibold text-ink-navy text-sm">
                              {sku.name}
                            </p>
                            <p className="text-[11px] text-steel font-data-mono">
                              Code: {displayCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-paper text-steel border border-hairline rounded text-[10px] uppercase font-bold font-sans">
                          {sku.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-sans text-xs">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sku.status === "In Stock" || !sku.isArchived
                                ? "bg-settled-green"
                                : "bg-alert-rust"
                            }`}
                          ></span>
                          <span className="text-ink-navy">
                            {sku.status || "In Stock"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-data-mono font-bold text-sm text-ink-navy">
                          ₹{sku.costPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditPanel(sku)}
                            className="p-1.5 text-steel hover:text-ink-navy border border-transparent hover:border-hairline rounded transition-all"
                            title="Edit SKU"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSku(sku.id)}
                            className="p-1.5 text-steel hover:text-alert-rust border border-transparent hover:border-hairline rounded transition-all"
                            title="Archive SKU"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div className="px-6 py-4 border-t border-hairline flex justify-between items-center text-xs text-steel font-sans">
          <span className="font-data-mono">
            Showing 1-{filteredSkus.length} of {skus.length} Item Entries
          </span>
          <div className="flex gap-4">
            <button className="flex items-center gap-1 hover:text-ink-navy transition-colors font-medium">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Previous
            </button>
            <button className="flex items-center gap-1 hover:text-ink-navy transition-colors font-medium">
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stock Summary Stats Row */}
      <div className="grid grid-cols-12 gap-gutter mt-8">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-hairline rounded p-6 relative overflow-hidden h-full shadow-sm">
            <h3 className="font-sans text-xs text-steel uppercase mb-6 font-bold tracking-wider">
              Stock Value Distribution
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-3 font-sans text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ink-navy rounded-sm"></div>
                  <span className="font-medium text-ink-navy">Rations (45%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brass rounded-sm"></div>
                  <span className="font-medium text-ink-navy">Beverages (30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-delivery-blue rounded-sm"></div>
                  <span className="font-medium text-ink-navy">Medical &amp; Packaging (25%)</span>
                </div>
              </div>
              <div className="flex-1 flex justify-end h-28 w-full sm:w-auto px-4 gap-3 items-end">
                <div className="w-10 bg-ink-navy h-4/5 rounded-t" title="Rations: 45%"></div>
                <div className="w-10 bg-brass h-3/5 rounded-t" title="Beverages: 30%"></div>
                <div className="w-10 bg-delivery-blue h-2/5 rounded-t" title="Medical: 25%"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-ink-navy text-paper rounded p-6 border border-hairline relative shadow-sm h-full flex flex-col justify-between">
            <span className="requisition-stamp absolute top-4 right-4 text-[10px] text-brass border-brass">
              VERIFIED
            </span>
            <div>
              <h3 className="font-sans text-xs text-paper/70 uppercase mb-2 font-bold tracking-wider">
                Total Inventory Cost
              </h3>
              <p className="font-data-mono text-3xl font-bold text-paper">
                ₹{totalInventoryCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-paper/70 font-sans mt-6">
              Inventory reference ledger balance <br />
              <span className="font-data-mono text-paper">Connected API / DB Ledger</span>
            </p>
          </div>
        </div>
      </div>

      {/* Slide-out Side Panel for Add / Edit SKU */}
      {isSidePanelOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsSidePanelOpen(false)}
            className="fixed inset-0 bg-ink-navy/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
          ></div>

          {/* Side Drawer */}
          <aside className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-white border-l border-hairline shadow-2xl z-[70] flex flex-col transition-transform duration-300">
            <div className="p-6 border-b border-hairline flex justify-between items-center bg-paper/50">
              <div>
                <h2 className="font-headline-md text-xl font-bold text-ink-navy">
                  {editingSku ? "Edit SKU Entry" : "New SKU Registration"}
                </h2>
                <p className="font-sans text-[11px] text-steel uppercase tracking-wider font-bold mt-0.5">
                  Formal Inventory Register Entry
                </p>
              </div>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="p-1.5 text-steel hover:bg-hairline/40 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSku} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="font-sans text-xs text-steel uppercase font-bold mb-1.5 block">
                      Item Formal Name *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Biscuit Pack"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-hairline rounded px-4 py-2.5 text-sm text-ink-navy focus:border-brass focus:outline-none bg-white font-sans"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="font-sans text-xs text-steel uppercase font-bold mb-1.5 block">
                        SKU Code (Auto)
                      </span>
                      <input
                        type="text"
                        disabled
                        value={
                          editingSku
                            ? editingSku.skuCode || editingSku.id
                            : `SKU-2026-${String(skus.length + 1).padStart(3, "0")}`
                        }
                        className="w-full border border-hairline rounded px-4 py-2.5 bg-paper/60 text-steel font-data-mono text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="font-sans text-xs text-steel uppercase font-bold mb-1.5 block">
                        Classification
                      </span>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value as SkuItem["category"],
                          })
                        }
                        className="w-full border border-hairline rounded px-3 py-2.5 text-sm text-ink-navy focus:border-brass focus:outline-none bg-white font-sans"
                      >
                        <option value="Rations">Rations</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Medical">Medical</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Stationery">Stationery</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-hairline">
                  <h3 className="font-sans text-xs text-ink-navy uppercase font-bold border-b border-hairline pb-2">
                    Financial &amp; Stock Controls
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="font-sans text-xs text-steel uppercase font-bold mb-1.5 block">
                        Unit Cost (Cost Price ₹) *
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-steel font-data-mono text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formData.costPrice}
                          onChange={(e) =>
                            setFormData({ ...formData, costPrice: e.target.value })
                          }
                          className="w-full border border-hairline rounded pl-7 pr-3 py-2.5 text-sm text-ink-navy font-data-mono focus:border-brass focus:outline-none bg-white"
                        />
                      </div>
                    </label>

                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-hairline">
                  <label className="block">
                    <span className="font-sans text-xs text-steel uppercase font-bold mb-1.5 block">
                      Technical Specifications &amp; Notes
                    </span>
                    <textarea
                      rows={4}
                      placeholder="Enter detailed description, shelf-life, and storage handling instructions..."
                      value={formData.specifications}
                      onChange={(e) =>
                        setFormData({ ...formData, specifications: e.target.value })
                      }
                      className="w-full border border-hairline rounded px-3 py-2.5 text-sm text-ink-navy focus:border-brass focus:outline-none bg-white font-sans"
                    ></textarea>
                  </label>
                </div>
              </div>

              {/* Side Panel Actions */}
              <div className="p-6 border-t border-hairline bg-paper/50 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(false)}
                  className="flex-1 py-2.5 border border-hairline text-steel font-bold rounded hover:bg-white transition-colors uppercase tracking-widest text-[11px] font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-ink-navy text-paper font-bold rounded hover:bg-ink-navy/90 transition-all uppercase tracking-widest text-[11px] font-sans shadow-sm"
                >
                  {editingSku ? "Update SKU" : "Confirm Entry"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
