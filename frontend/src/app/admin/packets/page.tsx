"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface UnitOption {
  id: string;
  name: string;
}

export interface PacketItem {
  skuId: string;
  skuCode?: string;
  name: string;
  vendorName?: string;
  category?: string;
  qty: number;
  unitCost: number;
  sellingPrice: number;
}

export interface Packet {
  id: string;
  packetCode?: string;
  name: string;
  sellingPrice: number;
  totalCostPrice?: number;
  margin?: number;
  itemCount: number;
  availableStock: number;
  items: PacketItem[];
  mappedUnits?: UnitOption[];
  status?: string;
  isArchived?: boolean;
  category?: string;
}

export interface CatalogSkuItem {
  id: string;
  skuCode?: string;
  name: string;
  category?: string;
  vendorName?: string;
  costPrice: number;
  sellingPrice: number;
}

// -------------------------------------------------------------------
// CUSTOM MULTI-SELECT DROPDOWN COMPONENT WITH SEARCH & CHECKBOXES
// -------------------------------------------------------------------
function UnitMultiSelectDropdown({
  allUnits,
  selectedUnits,
  onChange,
}: {
  allUnits: { id: string; name: string }[];
  selectedUnits: { id: string; name: string }[];
  onChange: (units: { id: string; name: string }[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUnits = allUnits?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUnit = (unit: { id: string; name: string }) => {
    if (selectedUnits.some((s) => s.id === unit.id)) {
      if (selectedUnits.length === 1) return; // Maintain at least 1 selected unit
      onChange(selectedUnits.filter((u) => u.id !== unit.id));
    } else {
      onChange([...selectedUnits, unit]);
    }
  };

  const handleSelectAll = () => {
    onChange([...allUnits]);
  };

  const handleDeselectAll = () => {
    if (allUnits.length > 0) {
      onChange([allUnits[0]]);
    }
  };

  return (
    <div className="relative font-sans">
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-hairline rounded p-2.5 min-h-[44px] cursor-pointer flex items-center justify-between hover:border-brass transition-all shadow-sm"
      >
        <div className="flex flex-wrap gap-1 items-center flex-1 pr-2">
          {selectedUnits.length === 0 ? (
            <span className="text-steel text-xs italic">Select Command Units...</span>
          ) : (
            selectedUnits.map((u) => (
              <span
                key={u.id}
                className="bg-ink-navy/10 text-ink-navy border border-ink-navy/20 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1"
              >
                <span>{u.name}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUnit(u);
                  }}
                  className="hover:text-alert-rust cursor-pointer text-xs font-bold"
                  title="Remove Unit"
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 text-steel flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-paper px-1.5 py-0.5 rounded font-data-mono">
            {selectedUnits.length} / {allUnits.length}
          </span>
          <span className="material-symbols-outlined text-lg">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </div>
      </div>

      {/* Floating Searchable Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-hairline shadow-2xl rounded z-40 p-3 space-y-2 max-h-72 flex flex-col">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-steel text-sm">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${allUnits.length} command units...`}
                className="w-full bg-paper/40 border border-hairline rounded pl-8 pr-3 py-1.5 text-xs text-ink-navy focus:outline-none focus:border-brass font-sans"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brass border-b border-hairline pb-1.5 px-0.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="hover:underline text-ink-navy cursor-pointer"
              >
                Select All ({allUnits.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="hover:underline text-steel cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-1 pr-1 divide-y divide-hairline/40">
              {filteredUnits.length === 0 ? (
                <div className="p-3 text-center text-xs text-steel italic">
                  No units matching &quot;{search}&quot;
                </div>
              ) : (
                filteredUnits.map((u) => {
                  const isChecked = selectedUnits.some((s) => s.id === u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs font-sans select-none ${
                        isChecked
                          ? "bg-brass/10 text-ink-navy font-semibold"
                          : "hover:bg-paper text-steel"
                      }`}
                    >
                      <span className="truncate pr-2">{u.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleUnit(u)}
                        className="rounded border-hairline text-brass focus:ring-brass w-4 h-4 cursor-pointer"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPacketsPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [skuCatalog, setSkuCatalog] = useState<CatalogSkuItem[]>([]);
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  
  // Status Tab Filter for Super Admin (ACTIVE, ARCHIVED, ALL)
  const [statusTab, setStatusTab] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");

  // Edit / Form State
  const [editingPacketId, setEditingPacketId] = useState<string | null>(null);
  const [packetName, setPacketName] = useState<string>("");
  const [addedItems, setAddedItems] = useState<PacketItem[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>([]);

  // SKU Search & Suggestions State
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Archive Confirmation Modal State
  const [archivingPacket, setArchivingPacket] = useState<Packet | null>(null);

  // -------------------------------------------------------------------
  // API INTEGRATION: FETCH ALL PACKETS & CATALOG SKUs WITH VENDORS
  // -------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Packets list
      const pktRes = await authFetch("/api/admin/packets?includeArchived=true");
      if (pktRes.ok) {
        const json = await pktRes.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: Packet[] = json.data.map((p: any) => {
            const cost = p.totalCostPrice || 0;
            const selling = p.sellingPrice || 0;
            const calculatedMargin = p.margin !== undefined ? p.margin : Math.max(0, selling - cost);

            return {
              id: p.id,
              packetCode: p.packetCode || p.code,
              name: p.name,
              sellingPrice: selling,
              totalCostPrice: cost,
              margin: calculatedMargin,
              itemCount: p.childSkus?.length || p.itemCount || 0,
              availableStock: p.availableStock || 100,
              mappedUnits: (p.mappedUnits || []).map((u: any) => ({
                id: u.unitId || u.id,
                name: u.unitName || u.name,
              })),
              items: (p.childSkus || []).map((cs: any) => ({
                skuId: cs.skuCode || cs.skuId || cs.sku?.skuCode || cs.sku?.id,
                skuCode: cs.skuCode || cs.skuId || cs.sku?.skuCode,
                name: cs.skuName || cs.name || cs.sku?.name || "SKU Item",
                vendorName: cs.vendorName || cs.sku?.vendor?.name || "Approved Supplier",
                category: cs.category || cs.sku?.category || "Beverages",
                qty: cs.quantity || 1,
                unitCost: cs.costPrice || cs.unitCost || cs.sku?.costPrice || 15.0,
                sellingPrice: cs.sellingPrice !== undefined ? Number(cs.sellingPrice) : (cs.sku?.costPrice ? Number(cs.sku.costPrice) : 20.0),
              })),
              status: p.status || (p.isArchived ? "ARCHIVED" : "ACTIVE"),
              isArchived: p.isArchived ?? p.status === "ARCHIVED",
            };
          });
          setPackets(mapped);
        }
      }

      // 2. Fetch Catalog SKUs including Vendor details
      const skuRes = await authFetch("/api/admin/skus");
      if (skuRes.ok) {
        const skuJson = await skuRes.json();
        if (skuJson.success && Array.isArray(skuJson.data) && skuJson.data.length > 0) {
          const mappedCatalog: CatalogSkuItem[] = skuJson.data.map((item: any) => ({
            id: item.id || item.skuCode,
            skuCode: item.skuCode || item.code || item.id,
            name: item.name,
            category: item.category || "Beverages",
            vendorName: item.vendorName || item.vendor?.name || "Approved Supplier",
            costPrice: Number(item.costPrice) || 15.0,
            sellingPrice: Number(item.sellingPrice || item.costPrice),
          }));
          setSkuCatalog(mappedCatalog);
        }
      }

      // 3. Fetch Units catalog
      const unitRes = await authFetch("/api/admin/units");
      if (unitRes.ok) {
        const unitJson = await unitRes.json();
        if (unitJson.success && Array.isArray(unitJson.data) && unitJson.data.length > 0) {
          const units = unitJson.data.map((u: any) => ({ id: u.id, name: u.name }));
          setAvailableUnits(units);
        }
      }
    } catch (err) {
      console.warn("Backend API loading error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregated Cost Price (sum of Qty * Base Unit Cost)
  const aggregatedCostPrice = addedItems.reduce(
    (sum, item) => sum + item.qty * item.unitCost,
    0
  );

  // Aggregated Selling Price (sum of Qty * Item Selling Price)
  const aggregatedSellingPrice = addedItems.reduce(
    (sum, item) => sum + item.qty * (item.sellingPrice || item.unitCost),
    0
  );

  // Margin Calculation
  const marginAmount = Math.max(0, aggregatedSellingPrice - aggregatedCostPrice);
  const marginPercent = aggregatedCostPrice > 0 ? ((marginAmount / aggregatedCostPrice) * 100).toFixed(1) : "0.0";

  // Handle Add Item to Packet Builder
  const handleAddItemFromCatalog = (sku: CatalogSkuItem) => {
    const existingIndex = addedItems.findIndex((item) => item.skuId === sku.id || item.name === sku.name);
    if (existingIndex > -1) {
      const updated = [...addedItems];
      updated[existingIndex].qty += 1;
      setAddedItems(updated);
    } else {
      setAddedItems([
        ...addedItems,
        {
          skuId: sku.id,
          skuCode: sku.skuCode || sku.id,
          name: sku.name,
          vendorName: sku.vendorName || "Approved Supplier",
          category: sku.category || "Beverages",
          qty: 1,
          unitCost: sku.costPrice,
          sellingPrice: sku.sellingPrice || sku.costPrice,
        },
      ]);
    }
    setSkuSearchQuery("");
    setShowSuggestions(false);
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...addedItems];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].qty = newQty;
    }
    setAddedItems(updated);
  };

  const handleUpdateSellingPrice = (index: number, valStr: string) => {
    const updated = [...addedItems];
    const val = parseFloat(valStr);
    updated[index].sellingPrice = isNaN(val) ? 0 : val;
    setAddedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...addedItems];
    updated.splice(index, 1);
    setAddedItems(updated);
  };

  // -------------------------------------------------------------------
  // API INTEGRATION: SAVE / EDIT PACKET WITH SAFE CODE GENERATION
  // -------------------------------------------------------------------
  const handleSavePacket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!packetName.trim()) {
      alert("Please provide a name for the refreshment packet.");
      return;
    }
    if (addedItems.length === 0) {
      alert("Please add at least one SKU to the packet composition.");
      return;
    }
    if (selectedUnits.length === 0) {
      alert("Please select at least one military unit for this packet.");
      return;
    }

    setSubmitting(true);

    // SAFE PACKET CODE GENERATION: Find MAX numeric index across all packets
    let maxCodeVal = 0;
    packets.forEach((p) => {
      const codeStr = p.packetCode || p.id || "";
      const match = codeStr.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxCodeVal) maxCodeVal = val;
      }
    });

    const autoCode = editingPacketId || `PKT-${String(maxCodeVal + 1).padStart(3, "0")}`;

    const payload = {
      id: editingPacketId || undefined,
      packetCode: autoCode,
      name: packetName,
      category: "Standard Refreshment",
      sellingPrice: aggregatedSellingPrice,
      totalCostPrice: aggregatedCostPrice,
      margin: marginAmount,
      mappedUnits: selectedUnits.map((u) => ({ unitId: u.id })),
      skus: addedItems.map((item) => ({
        skuId: item.skuId,
        quantity: item.qty,
        sellingPrice: item.sellingPrice,
      })),
    };

    try {
      const isEdit = Boolean(editingPacketId);
      const url = isEdit ? `/api/admin/packets/${editingPacketId}` : "/api/admin/packets";
      const method = isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
      } else {
        // Fallback optimistic update
        if (isEdit) {
          setPackets(
            packets.map((p) =>
              p.id === editingPacketId
                ? {
                    ...p,
                    name: packetName,
                    sellingPrice: aggregatedSellingPrice,
                    totalCostPrice: aggregatedCostPrice,
                    margin: marginAmount,
                    mappedUnits: selectedUnits,
                    items: addedItems,
                    itemCount: addedItems.reduce((acc, i) => acc + i.qty, 0),
                  }
                : p
            )
          );
        } else {
          const newPacket: Packet = {
            id: autoCode,
            packetCode: autoCode,
            name: packetName,
            sellingPrice: aggregatedSellingPrice,
            totalCostPrice: aggregatedCostPrice,
            margin: marginAmount,
            itemCount: addedItems.reduce((acc, i) => acc + i.qty, 0),
            availableStock: 100,
            mappedUnits: selectedUnits,
            items: addedItems,
            status: "ACTIVE",
            isArchived: false,
          };
          setPackets([newPacket, ...packets]);
        }
      }
    } catch (err) {
      console.error("Save/Edit Packet API error:", err);
    } finally {
      setSubmitting(false);
      setViewMode("list");
      setPacketName("");
      setEditingPacketId(null);
      setAddedItems([]);
      setSelectedUnits(availableUnits.length > 0 ? [availableUnits[0]] : []);
    }
  };

  // Open Edit Packet Flow (Preserves stored per-SKU selling price)
  const handleOpenEditFlow = (pkt: Packet) => {
    setEditingPacketId(pkt.id);
    setPacketName(pkt.name);
    setAddedItems(
      (pkt.items || []).map((item) => ({
        ...item,
        sellingPrice: item.sellingPrice !== undefined ? Number(item.sellingPrice) : item.unitCost,
      }))
    );
    setSelectedUnits(
      pkt.mappedUnits && pkt.mappedUnits.length > 0
        ? pkt.mappedUnits
        : availableUnits.length > 0
        ? [availableUnits[0]]
        : []
    );
    setViewMode("edit");
  };

  const handleOpenCreateFlow = () => {
    setEditingPacketId(null);
    setPacketName("");
    setAddedItems([]);
    setSelectedUnits(availableUnits.length > 0 ? [availableUnits[0]] : []);
    setViewMode("create");
  };

  // ARCHIVE PACKET (authFetch DELETE /api/admin/packets/:id)
  const handleConfirmArchivePacket = async () => {
    if (!archivingPacket) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/packets/${archivingPacket.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      } else {
        setPackets((prev) =>
          prev.map((p) => (p.id === archivingPacket.id ? { ...p, status: "ARCHIVED", isArchived: true } : p))
        );
      }
    } catch (err) {
      console.error("Archive Packet API error:", err);
    } finally {
      setSubmitting(false);
      setArchivingPacket(null);
    }
  };

  // RE-ACTIVATE PACKET FOR SUPER ADMIN
  const handleReactivatePacket = async (pkt: Packet) => {
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/packets/${pkt.id}/reactivate`, {
        method: "PATCH",
      });

      if (res.ok) {
        await loadData();
      } else {
        setPackets((prev) =>
          prev.map((p) => (p.id === pkt.id ? { ...p, status: "ACTIVE", isArchived: false } : p))
        );
      }
    } catch (err) {
      console.error("Reactivate Packet API error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Packets by Status Tab
  const filteredPackets = packets.filter((p) => {
    if (statusTab === "ACTIVE") return !p.isArchived && p.status !== "ARCHIVED";
    if (statusTab === "ARCHIVED") return p.isArchived || p.status === "ARCHIVED";
    return true;
  });

  return (
    <div className="p-container-padding flex-1 bg-paper/30 font-sans">
      {/* View 1: Packet Dashboard */}
      {viewMode === "list" && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
                Refreshment Packets
              </h1>
              <p className="font-sans text-sm text-steel mt-1">
                Manage institutional refreshment bundles, vendor SKU compositions, and selling price structures.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-brass font-data-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
                  Syncing Packets API...
                </span>
              )}
              <button
                onClick={handleOpenCreateFlow}
                className="bg-brass hover:bg-brass/90 text-white font-bold px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest font-sans cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_box</span>
                Define New Packet
              </button>
            </div>
          </div>

          {/* Super Admin Status Filter Tabs (Active, Archived, All) */}
          <div className="flex items-center gap-2 border-b border-hairline pb-2">
            <button
              onClick={() => setStatusTab("ACTIVE")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusTab === "ACTIVE"
                  ? "bg-ink-navy text-white shadow-sm"
                  : "bg-white text-steel hover:text-ink-navy border border-hairline"
              }`}
            >
              Active Packets ({packets.filter((p) => !p.isArchived && p.status !== "ARCHIVED").length})
            </button>
            <button
              onClick={() => setStatusTab("ARCHIVED")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusTab === "ARCHIVED"
                  ? "bg-alert-rust text-white shadow-sm"
                  : "bg-white text-steel hover:text-ink-navy border border-hairline"
              }`}
            >
              Archived Packets ({packets.filter((p) => p.isArchived || p.status === "ARCHIVED").length})
            </button>
            <button
              onClick={() => setStatusTab("ALL")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusTab === "ALL"
                  ? "bg-brass text-white shadow-sm"
                  : "bg-white text-steel hover:text-ink-navy border border-hairline"
              }`}
            >
              All Packets ({packets.length})
            </button>
          </div>

          {/* Packets Grid */}
          {filteredPackets.length === 0 ? (
            <div className="bg-white border-2 border-hairline rounded-lg p-12 text-center text-steel italic text-sm">
              No packets found in &quot;{statusTab}&quot; tab. Click &quot;Define New Packet&quot; to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
              {filteredPackets.map((pkt) => {
                const isArchived = pkt.isArchived || pkt.status === "ARCHIVED";
                const pktMargin = pkt.margin !== undefined ? pkt.margin : Math.max(0, pkt.sellingPrice - (pkt.totalCostPrice || 0));

                return (
                  <div
                    key={pkt.id}
                    className={`bg-white border-2 rounded p-6 transition-all duration-200 group relative overflow-hidden shadow-sm flex flex-col justify-between ${
                      isArchived ? "border-alert-rust/30 bg-paper/30 opacity-80" : "border-hairline hover:border-brass"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2.5 rounded transition-colors ${
                          isArchived ? "bg-alert-rust/10 text-alert-rust" : "bg-paper text-ink-navy group-hover:bg-brass group-hover:text-white"
                        }`}>
                          <span className="material-symbols-outlined text-2xl">
                            package_2
                          </span>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-1.5">
                          {isArchived ? (
                            <button
                              onClick={() => handleReactivatePacket(pkt)}
                              className="px-2.5 py-1 bg-settled-green hover:bg-settled-green/90 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              title="Re-activate Packet"
                            >
                              <span className="material-symbols-outlined text-xs">restart_alt</span>
                              <span>Re-activate</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-paper/60 p-1 rounded border border-hairline">
                              <button
                                onClick={() => handleOpenEditFlow(pkt)}
                                className="p-1 text-steel hover:text-ink-navy transition-colors rounded hover:bg-white cursor-pointer"
                                title="Edit Packet Composition"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => setArchivingPacket(pkt)}
                                className="p-1 text-steel hover:text-alert-rust transition-colors rounded hover:bg-white cursor-pointer"
                                title="Archive Packet"
                              >
                                <span className="material-symbols-outlined text-base">archive</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-headline-md text-xl text-ink-navy font-bold">
                          {pkt.name}
                        </h3>
                        {isArchived && (
                          <span className="px-2 py-0.5 bg-alert-rust/10 text-alert-rust border border-alert-rust/20 rounded text-[9px] font-bold uppercase">
                            Archived
                          </span>
                        )}
                      </div>

                      <span className="font-data-mono text-xs font-bold text-brass block mb-2">
                        {pkt.packetCode || pkt.id}
                      </span>

                      <p className="text-steel font-sans text-xs mb-3">
                        {pkt.items.reduce((sum, i) => sum + i.qty, 0)} Items •{" "}
                        {pkt.availableStock} Available
                      </p>

                      {/* Multi-Unit Badges */}
                      <div className="mb-4 pt-2 border-t border-hairline">
                        <p className="text-[10px] uppercase font-bold text-steel mb-1.5">
                          Mapped Command Units:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pkt.mappedUnits && pkt.mappedUnits.length > 0 ? (
                            pkt.mappedUnits.map((u) => (
                              <span
                                key={u.id}
                                className="bg-ink-navy/10 text-ink-navy px-2 py-0.5 rounded text-[10px] font-bold font-sans"
                              >
                                {u.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-steel italic">All Units</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-hairline">
                      <div className="flex justify-between items-baseline">
                        <span className="text-steel font-sans text-[10px] uppercase font-bold tracking-wider">
                          Selling Price
                        </span>
                        <span className="font-data-mono text-xl font-bold text-brass">
                          ₹{pkt.sellingPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-settled-green/10 px-2.5 py-1 rounded border border-settled-green/20 text-xs">
                        <span className="text-[10px] font-bold text-settled-green uppercase">Margin Profit</span>
                        <span className="font-data-mono font-bold text-settled-green">₹{pktMargin.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                onClick={handleOpenCreateFlow}
                className="border-2 border-dashed border-hairline rounded p-6 flex flex-col items-center justify-center text-steel hover:bg-white hover:border-brass hover:text-brass transition-all cursor-pointer group min-h-[220px]"
              >
                <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">
                  add_circle
                </span>
                <span className="font-sans uppercase tracking-widest text-xs font-bold">
                  Define New Packet
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2 & 3: Creation & Edit Flow (Refreshed Kitting Tool UI) */}
      {(viewMode === "create" || viewMode === "edit") && (
        <div className="max-w-7xl mx-auto space-y-6 font-sans">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setViewMode("list")}
              className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-hairline text-steel cursor-pointer"
              title="Back to Packets Register"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-ink-navy">
                {viewMode === "edit" ? "Edit Packet Protocol" : "Define New Refreshment Packet"}
              </h2>
              <p className="text-xs text-steel font-medium">
                Assembly protocol, SKU unit costs &amp; selling price margin calculations for refreshment bundles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column: SKU Selection & Packet Composition */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Search & Inventory Lookup Area */}
              <div className="bg-white rounded-lg border border-hairline p-6 shadow-sm relative">
                <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2">
                  Inventory SKU Lookup &amp; Supplier Selection
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={skuSearchQuery}
                    onChange={(e) => {
                      setSkuSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search SKUs (e.g., Biscuit Pack, Juice Box, ORS)... results grouped by vendor."
                    className="w-full pl-10 pr-4 py-3 bg-paper/30 border border-hairline rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-brass transition-all"
                  />
                </div>

                {/* Autocomplete Suggestions Dropdown with Vendor Info */}
                {showSuggestions && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowSuggestions(false)}
                    ></div>
                    <div className="absolute top-full left-6 right-6 mt-1 bg-white border border-hairline rounded-lg shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-hairline">
                      {skuCatalog
                        .filter((s) =>
                          s.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
                          (s.vendorName && s.vendorName.toLowerCase().includes(skuSearchQuery.toLowerCase())) ||
                          (s.skuCode && s.skuCode.toLowerCase().includes(skuSearchQuery.toLowerCase()))
                        )
                        .map((sku) => (
                          <div
                            key={sku.id}
                            onClick={() => handleAddItemFromCatalog(sku)}
                            className="p-3.5 hover:bg-paper cursor-pointer flex justify-between items-center text-xs font-sans transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink-navy text-sm">{sku.name}</span>
                                <span className="px-2 py-0.5 bg-ink-navy/10 text-ink-navy rounded font-data-mono text-[10px] font-bold">
                                  {sku.skuCode}
                                </span>
                                {sku.category && (
                                  <span className="px-2 py-0.5 bg-brass/10 text-brass rounded text-[10px] font-bold">
                                    {sku.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-steel font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">store</span>
                                <span>Supplier: {sku.vendorName || "Approved Vendor"}</span>
                              </div>
                            </div>

                            <div className="text-right font-data-mono">
                              <div className="text-brass font-bold text-sm">₹{sku.costPrice.toFixed(2)} unit cost</div>
                              {/* <div className="text-[10px] text-steel">Base Selling: ₹{sku.sellingPrice.toFixed(2)}</div> */}
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Packet Composition Card Table */}
              <div className="bg-white rounded-lg border border-hairline overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-hairline bg-paper/20 flex justify-between items-center">
                  <h3 className="text-ink-navy font-bold text-base">Packet Composition</h3>
                  <span className="text-steel font-sans text-xs uppercase font-bold">
                    {addedItems.length} {addedItems.length === 1 ? "Item" : "Items"} Selected
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-sans">
                    <thead className="bg-paper/40 text-steel font-bold uppercase text-[10px] tracking-wider border-b border-hairline">
                      <tr>
                        <th className="px-6 py-3.5">Item Description</th>
                        <th className="px-6 py-3.5 text-center">Quantity</th>
                        <th className="px-6 py-3.5 text-right">Unit Cost</th>
                        <th className="px-6 py-3.5 text-right">Selling Price (₹)</th>
                        <th className="px-6 py-3.5 text-right">Total</th>
                        <th className="px-6 py-3.5 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {addedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-steel italic">
                            No SKU items added to packet composition. Use inventory lookup above to search &amp; add SKUs.
                          </td>
                        </tr>
                      ) : (
                        addedItems.map((item, idx) => (
                          <tr key={item.skuId || idx} className="hover:bg-paper/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-ink-navy text-sm">{item.name}</div>
                              <div className="text-[11px] text-steel flex items-center gap-2 mt-0.5">
                                {/* <span className="font-data-mono text-[#C98A3D] font-bold">{item.skuCode || item.skuId}</span> */}
                                {item.vendorName && (
                                  <span className="text-[#C98A3D] italic">• {item.vendorName}</span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(idx, -1)}
                                  className="w-8 h-8 border border-hairline rounded flex items-center justify-center text-steel hover:bg-paper hover:text-ink-navy transition-colors font-bold text-sm cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-data-mono font-bold text-ink-navy text-sm">
                                  {String(item.qty).padStart(2, "0")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(idx, 1)}
                                  className="w-8 h-8 border border-hairline rounded flex items-center justify-center text-steel hover:bg-paper hover:text-ink-navy transition-colors font-bold text-sm cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right font-data-mono font-semibold text-steel">
                              ₹{item.unitCost.toFixed(2)}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 font-data-mono font-bold text-ink-navy">
                                <span>₹</span>
                                <input
                                  type="text"
                                  value={item.sellingPrice}
                                  onChange={(e) => handleUpdateSellingPrice(idx, e.target.value)}
                                  className="w-16 text-right bg-paper/30 border border-hairline rounded px-2 py-1 focus:outline-none focus:border-brass font-data-mono font-bold"
                                />
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right font-data-mono font-bold text-brass text-sm">
                              ₹{(item.qty * (item.sellingPrice || item.unitCost)).toFixed(2)}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-alert-rust hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                title="Remove Item"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-paper/10 p-4 px-6 flex justify-between items-center italic text-steel text-xs border-t border-hairline">
                  * Note: Base reference costs are linked to supplier vendor master records. Super Admin can adjust selling price per unit.
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Packet Metadata Panel with Margin Card */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <form onSubmit={handleSavePacket} className="bg-white rounded-lg border border-hairline p-7 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brass"></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1.5">
                      Packet Identity *
                    </label>
                    <input
                      type="text"
                      required
                      value={packetName}
                      onChange={(e) => setPacketName(e.target.value)}
                      placeholder="e.g. Standard Cadet Ration Alpha"
                      className="w-full border-b border-hairline py-2 text-lg font-bold text-ink-navy focus:border-brass focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1.5">
                      Mapped Military Command Units *
                    </label>
                    <UnitMultiSelectDropdown
                      allUnits={availableUnits}
                      selectedUnits={selectedUnits}
                      onChange={(units) => setSelectedUnits(units)}
                    />
                  </div>

                  <div className="border-t border-hairline pt-4 space-y-3">
                    <div className="p-3.5 bg-paper/40 rounded-lg border border-hairline flex justify-between items-center">
                      <span className="text-xs text-steel uppercase font-bold">Total Cost Price</span>
                      <span className="font-data-mono font-bold text-steel text-base">₹{aggregatedCostPrice.toFixed(2)}</span>
                    </div>

                    <div className="p-4 bg-brass/10 rounded-lg border border-brass border-dashed flex justify-between items-center">
                      <div>
                        <span className="block text-brass font-bold text-xs uppercase tracking-wider">Total Selling Price</span>
                        <span className="text-[10px] text-steel">Sum of composition items</span>
                      </div>
                      <span className="text-2xl font-data-mono font-bold text-brass">₹{aggregatedSellingPrice.toFixed(2)}</span>
                    </div>

                    {/* DEDICATED PACKET PROFIT MARGIN CARD */}
                    <div className="p-4 bg-settled-green/10 rounded-lg border border-settled-green/30 flex justify-between items-center">
                      <div>
                        <span className="block text-settled-green font-bold text-xs uppercase tracking-wider">
                          Packet Profit Margin
                        </span>
                        <span className="text-[10px] text-steel">
                          Selling Price - Total Cost
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-data-mono font-bold text-settled-green block">
                          ₹{marginAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-settled-green bg-settled-green/20 px-2 py-0.5 rounded">
                          +{marginPercent}% Profit
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brass hover:bg-brass/90 text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Publishing Packet..." : editingPacketId ? "Update Packet Protocol" : "Publish to Register"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="w-full mt-2.5 bg-paper hover:bg-hairline text-ink-navy font-bold text-xs uppercase tracking-wider py-2 rounded border border-hairline transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {archivingPacket && (
        <>
          <div
            onClick={() => setArchivingPacket(null)}
            className="fixed inset-0 bg-ink-navy/30 backdrop-blur-sm z-[55] transition-opacity"
          ></div>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-hairline max-w-md w-full p-6 rounded-lg shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-alert-rust border-b border-hairline pb-3">
                <span className="material-symbols-outlined text-2xl">archive</span>
                <h3 className="font-headline font-bold text-lg text-ink-navy">
                  Archive Refreshment Packet?
                </h3>
              </div>

              <p className="text-xs text-steel font-medium leading-relaxed">
                Are you sure you want to archive <strong>{archivingPacket.name}</strong>? It will be hidden from Unit and School ordering portals, but will remain visible to Super Admin in the Archived tab.
              </p>

              <div className="pt-3 border-t border-hairline flex gap-3">
                <button
                  type="button"
                  onClick={() => setArchivingPacket(null)}
                  className="flex-1 py-2 bg-paper hover:bg-hairline text-ink-navy font-bold text-xs uppercase tracking-wider rounded border border-hairline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmArchivePacket}
                  disabled={submitting}
                  className="flex-1 py-2 bg-alert-rust hover:bg-alert-rust/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? "Archiving..." : "Confirm Archive"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
