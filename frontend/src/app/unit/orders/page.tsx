"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface RequisitionPacketOption {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  itemsList: string[];
  icon: string;
}

export interface UnitPlacedOrder {
  id: string;
  orderCode: string;
  packetName: string;
  location: string;
  deliveryDate: string;
  qty: number;
  status: string;
}

export interface MappedSchoolOption {
  id: string;
  code: string;
  name: string;
  address: string;
}

export interface DeliveryDestinationRow {
  id: string;
  schoolId: string;
  location: string;
  quantity: number;
  deliveryDate: string;
  isCollapsed: boolean;
}

// -------------------------------------------------------------------
// INTERACTIVE CALENDAR PICKER COMPONENT (TIMEZONE-SAFE & PAST DATES BLOCKED)
// -------------------------------------------------------------------
function CalendarPicker({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (formattedDate: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Today Date normalized at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="border-2 border-hairline rounded-lg p-5 bg-paper/30 max-w-sm shadow-sm font-sans">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-ink-navy hover:text-brass rounded hover:bg-white transition-colors active:scale-95 flex items-center justify-center border border-hairline cursor-pointer"
          title="Previous Month"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <span className="text-sm font-bold text-ink-navy font-headline uppercase tracking-wider">
          {monthName} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-ink-navy hover:text-brass rounded hover:bg-white transition-colors active:scale-95 flex items-center justify-center border border-hairline cursor-pointer"
          title="Next Month"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[11px] font-bold text-ink-navy uppercase tracking-wider">
        <div>SU</div><div>MO</div><div>TU</div><div>WE</div><div>TH</div><div>FR</div><div>SA</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-data-mono text-xs text-ink-navy">
        {/* Padding days from previous month */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`prev-${idx}`} className="py-2 text-steel/30 font-medium">
            {prevMonthDays - firstDayIndex + idx + 1}
          </div>
        ))}

        {/* Days in current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateObj = new Date(year, month, dayNum);
          dateObj.setHours(0, 0, 0, 0);

          // Timezone safe YYYY-MM-DD string to avoid 1-day rollback in UTC
          const monthFormatted = String(month + 1).padStart(2, "0");
          const dayFormatted = String(dayNum).padStart(2, "0");
          const isoDateStr = `${year}-${monthFormatted}-${dayFormatted}`;
          
          const displayFormatted = `${dayNum} ${dateObj.toLocaleString("en-GB", { month: "short" })} ${year}`;
          const isSelected = selectedDate === isoDateStr || selectedDate === displayFormatted;
          const isPast = dateObj < today;

          if (isPast) {
            return (
              <div
                key={`day-${dayNum}`}
                className="py-2 rounded font-bold select-none text-steel/30 bg-paper/60 border border-hairline/40 cursor-not-allowed line-through"
                title="Past dates cannot be selected for delivery"
              >
                {dayNum}
              </div>
            );
          }

          return (
            <div
              key={`day-${dayNum}`}
              onClick={() => onSelectDate(isoDateStr)}
              className={`py-2 rounded cursor-pointer transition-all font-bold select-none ${
                isSelected
                  ? "bg-delivery-blue text-white shadow-md scale-105"
                  : "hover:bg-brass/20 bg-white border border-hairline"
              }`}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UnitOrdersPage() {
  const [packetOptions, setPacketOptions] = useState<RequisitionPacketOption[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<RequisitionPacketOption | null>(null);

  // Mapped Schools List
  const [schoolsList, setSchoolsList] = useState<MappedSchoolOption[]>([]);
  
  // Dynamic Multi-School Delivery Destination Rows
  const getTodayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [deliveryRows, setDeliveryRows] = useState<DeliveryDestinationRow[]>([
    {
      id: "row-1",
      schoolId: "",
      location: "",
      quantity: 100,
      deliveryDate: getTodayISO(),
      isCollapsed: false,
    },
  ]);

  const [ordersRegister, setOrdersRegister] = useState<UnitPlacedOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string>("");
  const [orderErrorMsg, setOrderErrorMsg] = useState<string>("");

  // Fetch Packets, Mapped Schools, and Placed Orders via authFetch
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch available packets for this unit
      const pktRes = await authFetch("/api/unit/packets");
      if (pktRes.ok) {
        const pktJson = await pktRes.json();
        if (pktJson.success && Array.isArray(pktJson.data)) {
          const mappedPackets: RequisitionPacketOption[] = pktJson.data.map((p: any) => ({
            id: p.id || p.packetCode,
            name: p.name,
            description: p.description || `${p.itemCount} Item Bundle`,
            itemCount: p.itemCount,
            itemsList: Array.isArray(p.itemsList) ? p.itemsList : [],
            icon: p.icon || "inventory_2",
          }));
          setPacketOptions(mappedPackets);
          if (mappedPackets.length > 0) {
            setSelectedPacket(mappedPackets[0]);
          }
        }
      }

      // 2. Fetch mapped schools for Unit Head dropdown selection
      const schoolRes = await authFetch("/api/unit/schools");
      if (schoolRes.ok) {
        const schoolJson = await schoolRes.json();
        if (schoolJson.success && Array.isArray(schoolJson.data)) {
          const mappedSchs: MappedSchoolOption[] = schoolJson.data.map((s: any) => ({
            id: s.id,
            code: s.schoolCode || s.code || `SCH-${s.id}`,
            name: s.name,
            address: s.address || "Main Campus",
          }));
          setSchoolsList(mappedSchs);
        }
      }

      // 3. Fetch placed orders history for this unit
      const ordRes = await authFetch("/api/unit/orders");
      if (ordRes.ok) {
        const ordJson = await ordRes.json();
        if (ordJson.success && Array.isArray(ordJson.data)) {
          const mappedOrders: UnitPlacedOrder[] = ordJson.data.map((o: any) => ({
            id: o.id,
            orderCode: o.orderCode || o.code || `#ORD-${o.id}`,
            packetName: o.packetName || o.packet?.name,
            location: o.location || o.deliveryLocation,
            deliveryDate: o.deliveryDate || "TBD",
            qty: o.quantity || o.qty || 0,
            status: o.status || "PENDING",
          }));
          setOrdersRegister(mappedOrders);
        }
      }
    } catch (err) {
      console.error("Unit Orders API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Delivery Row Handlers
  const handleAddDeliveryRow = () => {
    const newId = `row-${Date.now()}`;
    setDeliveryRows((prev) => [
      ...prev.map((r) => ({ ...r, isCollapsed: true })), // Collapse previous rows for clean UX
      {
        id: newId,
        schoolId: "",
        location: "",
        quantity: 100,
        deliveryDate: getTodayISO(),
        isCollapsed: false,
      },
    ]);
  };

  const handleRemoveDeliveryRow = (id: string) => {
    if (deliveryRows.length <= 1) return;
    setDeliveryRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleCollapseRow = (id: string) => {
    setDeliveryRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCollapsed: !r.isCollapsed } : r))
    );
  };

  const handleUpdateRow = (id: string, updates: Partial<DeliveryDestinationRow>) => {
    setDeliveryRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const totalPacketsCount = deliveryRows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  // Submit Requisition Orders (Supports Multi-School Delivery Rows!)
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPacket) {
      alert("Please select a packet type.");
      return;
    }

    // Validate each delivery row
    for (let i = 0; i < deliveryRows.length; i++) {
      const row = deliveryRows[i];
      if (!row.schoolId) {
        alert(`Please select a target school for Delivery Destination #${i + 1}.`);
        return;
      }
      if (!row.location.trim()) {
        alert(`Please enter a valid delivery location for Delivery Destination #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    setOrderSuccessMsg("");
    setOrderErrorMsg("");

    let successCount = 0;
    let failCount = 0;

    // Execute API creation for each school delivery row independently
    for (const row of deliveryRows) {
      const payload = {
        packetId: selectedPacket.id,
        packetName: selectedPacket.name,
        schoolId: row.schoolId,
        location: row.location,
        quantity: row.quantity,
        deliveryDate: row.deliveryDate,
      };

      try {
        const res = await authFetch("/api/unit/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error("Order creation error:", err);
        failCount++;
      }
    }

    if (successCount > 0) {
      setOrderSuccessMsg(
        `Successfully placed ${successCount} separate requisition order${successCount > 1 ? "s" : ""} across specified schools!`
      );

      setTimeout(() => setOrderSuccessMsg(""), 6000);
      
      setDeliveryRows([
        {
          id: `row-${Date.now()}`,
          schoolId: "",
          location: "",
          quantity: 100,
          deliveryDate: getTodayISO(),
          isCollapsed: false,
        },
      ]);

      await loadData();
    } else {
      setOrderErrorMsg("Failed to create requisition orders. Please check your network connection.");
    }

    setSubmitting(false);
  };

  return (
    <div className="p-8 flex-1 bg-paper/40 font-sans space-y-8">
      {/* Top Title Bar */}
      <div>
        <h2 className="font-headline font-bold text-3xl md:text-4xl text-ink-navy mb-1">
          Place Order &amp; Requisition Register
        </h2>
        <p className="text-sm font-semibold text-steel">
          Requisition refreshment packets for upcoming institutional activities under Unit Command.
        </p>
      </div>

      {orderSuccessMsg && (
        <div className="bg-settled-green/10 border-2 border-settled-green text-settled-green p-4 rounded shadow-sm text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {orderSuccessMsg}
          </span>
          <button onClick={() => setOrderSuccessMsg("")} className="uppercase text-[10px] underline font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {orderErrorMsg && (
        <div className="bg-alert-rust/10 border-2 border-alert-rust text-alert-rust p-4 rounded shadow-sm text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {orderErrorMsg}
          </span>
          <button onClick={() => setOrderErrorMsg("")} className="uppercase text-[10px] underline font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Canvas: Form + Summary Panel */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Form Sections */}
        <div className="flex-1 min-w-0 space-y-8 w-full max-w-[44rem]">
          {/* Section 1: Select a Packet Type */}
          <section className="bg-white border-2 border-hairline rounded-lg p-6 shadow-sm min-w-0">
            <div className="flex justify-between items-center border-b border-hairline pb-3 mb-5">
              <h3 className="font-label-caps text-xs uppercase tracking-widest text-ink-navy font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-brass text-base">inventory_2</span>
                1. Select a Packet Type
              </h3>
              {packetOptions.length > 3 && (
                <span className="text-[10px] text-steel font-bold uppercase tracking-wider flex items-center gap-1">
                  Scroll for more <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-steel italic text-sm">
                Loading available refreshment packets...
              </div>
            ) : packetOptions.length === 0 ? (
              <div className="p-8 text-center text-steel italic text-sm">
                No refreshment packets available for this unit.
              </div>
            ) : (
              /* Horizontal Scroll View for Packets */
              <div className="w-full overflow-hidden">
              <div className="flex overflow-x-auto gap-5 pb-4 snap-x border-b border-hairline scrollbar-thin scrollbar-thumb-brass/40">
                {packetOptions.map((pkt) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  return (
                    <div
                      key={pkt.id}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start border-2 rounded-lg p-5 cursor-pointer transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-brass/5 border-brass shadow-md ring-1 ring-brass"
                          : "bg-white border-hairline hover:border-brass/50 hover:bg-paper/20"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3.5 right-3.5 text-brass">
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        </div>
                      )}
                      <div className="mb-4">
                        <div className="p-3 bg-paper rounded-md w-fit mb-3 text-ink-navy border border-hairline">
                          <span className="material-symbols-outlined text-2xl text-ink-navy">
                            {pkt.icon || "local_cafe"}
                          </span>
                        </div>
                        <h4 className="font-headline font-bold text-ink-navy text-lg">
                          {pkt.name}
                        </h4>
                        <p className="text-xs font-medium text-steel mt-1.5 leading-relaxed">
                          {pkt.description}
                        </p>
                      </div>

                      <div className="border-t border-hairline pt-3 mt-auto flex justify-between items-center text-xs">
                        <span className="font-bold text-ink-navy font-sans">
                          {pkt.itemCount} items included
                        </span>
                        <span className="font-bold text-brass text-xs uppercase tracking-wider">
                          Standard Bundle
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}
          </section>

          {/* Section 2: Dynamic Multi-School Delivery Details */}
          <section className="bg-white border-2 border-hairline rounded-lg p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-hairline pb-3">
              <h3 className="font-label-caps text-xs uppercase tracking-widest text-ink-navy font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-brass text-base">local_shipping</span>
                2. Delivery Destinations ({deliveryRows.length} School{deliveryRows.length > 1 ? "s" : ""})
              </h3>

              <button
                type="button"
                onClick={handleAddDeliveryRow}
                className="bg-brass/10 hover:bg-brass text-brass hover:text-white border border-brass/30 px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Add School Delivery</span>
              </button>
            </div>

            {/* Dynamic Delivery Destination Accordion Cards */}
            <div className="space-y-4">
              {deliveryRows.map((row, idx) => {
                const selectedSchool = schoolsList.find((s) => s.id === row.schoolId);

                return (
                  <div
                    key={row.id}
                    className="border-2 border-hairline rounded-lg overflow-hidden bg-white shadow-sm transition-all"
                  >
                    {/* Collapsible Accordion Header */}
                    <div
                      onClick={() => handleToggleCollapseRow(row.id)}
                      className="px-5 py-3.5 bg-paper/60 border-b border-hairline flex items-center justify-between cursor-pointer hover:bg-paper transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-ink-navy text-white text-xs font-bold font-data-mono flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-ink-navy text-sm font-sans">
                          {selectedSchool ? selectedSchool.name : `Destination #${idx + 1} (Select School)`}
                        </span>
                        <span className="text-xs text-steel font-data-mono font-semibold">
                          • {row.quantity} pkts • {row.deliveryDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {deliveryRows.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDeliveryRow(row.id);
                            }}
                            className="p-1 text-steel hover:text-alert-rust rounded transition-colors cursor-pointer"
                            title="Remove this school delivery row"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                        <span className="material-symbols-outlined text-ink-navy transition-transform">
                          {row.isCollapsed ? "expand_more" : "expand_less"}
                        </span>
                      </div>
                    </div>

                    {/* Accordion Body Content */}
                    {!row.isCollapsed && (
                      <div className="p-5 space-y-5 bg-white font-sans">
                        {/* Target School Selector Dropdown */}
                        <div>
                          <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2">
                            Select Target School *
                          </label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-steel text-lg">
                              school
                            </span>
                            <select
                              value={row.schoolId}
                              onChange={(e) => {
                                const schId = e.target.value;
                                const sch = schoolsList.find((s) => s.id === schId);
                                handleUpdateRow(row.id, {
                                  schoolId: schId,
                                  location: sch ? `${sch.name}, ${sch.address}` : row.location,
                                });
                              }}
                              className="w-full pl-11 pr-10 py-3 border-2 border-hairline rounded-md focus:outline-none focus:border-brass text-sm font-semibold text-ink-navy bg-white shadow-sm appearance-none cursor-pointer"
                            >
                              <option value="">-- Select School for this Delivery --</option>
                              {schoolsList.map((sch) => (
                                <option key={sch.id} value={sch.id}>
                                  {sch.name} ({sch.address})
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-steel pointer-events-none">
                              expand_more
                            </span>
                          </div>
                        </div>

                        {/* Location Address & Quantity Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2">
                              Delivery Location Address *
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-steel text-lg">
                                location_on
                              </span>
                              <input
                                type="text"
                                required
                                value={row.location}
                                onChange={(e) => handleUpdateRow(row.id, { location: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 border-2 border-hairline rounded-md focus:outline-none focus:border-brass text-sm font-semibold text-ink-navy bg-white shadow-sm"
                                placeholder="Enter school delivery address..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2">
                              Requisition Quantity *
                            </label>
                            <div className="flex border-2 border-hairline rounded-md w-full overflow-hidden shadow-sm h-[46px] bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateRow(row.id, { quantity: Math.max(1, row.quantity - 10) })}
                                className="px-4 bg-paper hover:bg-brass hover:text-white text-ink-navy font-bold text-lg border-r-2 border-hairline transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                                title="Decrease Quantity"
                              >
                                <span className="material-symbols-outlined text-[22px] leading-none">remove</span>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={row.quantity}
                                onChange={(e) => handleUpdateRow(row.id, { quantity: Math.max(1, Number(e.target.value) || 0) })}
                                className="flex-1 min-w-0 text-center border-none focus:ring-0 font-data-mono font-bold text-xl text-ink-navy bg-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateRow(row.id, { quantity: row.quantity + 10 })}
                                className="px-4 bg-paper hover:bg-brass hover:text-white text-ink-navy font-bold text-lg border-l-2 border-hairline transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                                title="Increase Quantity"
                              >
                                <span className="material-symbols-outlined text-[22px] leading-none">add</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Date Calendar Picker */}
                        <div>
                          <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2">
                            Required Delivery Date * ({row.deliveryDate})
                          </label>
                          <CalendarPicker
                            selectedDate={row.deliveryDate}
                            onSelectDate={(date) => handleUpdateRow(row.id, { deliveryDate: date })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Requisition Summary Panel */}
        <div className="w-full lg:w-80 sticky top-20">
          <div className="bg-white border-2 border-hairline rounded-lg p-6 shadow-md space-y-6">
            <h3 className="font-headline font-bold text-lg text-ink-navy border-b border-hairline pb-3 flex items-center justify-between">
              <span>Requisition Summary</span>
              <span className="material-symbols-outlined text-brass text-xl">receipt</span>
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex justify-between items-center text-steel">
                <span className="font-bold text-steel">Selected Packet</span>
                <span className="font-bold text-ink-navy">
                  {selectedPacket ? selectedPacket.name : "None Selected"}
                </span>
              </div>

              {selectedPacket && (
                <div className="pl-3 border-l-4 border-brass bg-paper/50 p-3 rounded-r border border-hairline">
                  <p className="text-[11px] text-ink-navy font-bold uppercase tracking-wider mb-1">
                    Composition ({selectedPacket.itemCount} Items):
                  </p>
                  <ul className="text-[11px] text-steel font-medium list-disc list-inside space-y-0.5">
                    {selectedPacket.itemsList.map((itm, idx) => (
                      <li key={idx}>{itm}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center text-steel border-t border-hairline pt-3">
                <span className="font-bold text-steel">Destinations Count</span>
                <span className="font-data-mono font-bold text-ink-navy text-sm">
                  {deliveryRows.length} School{deliveryRows.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex justify-between items-center text-steel">
                <span className="font-bold text-steel">Total Requisition Qty</span>
                <span className="font-data-mono font-bold text-brass text-base">
                  {totalPacketsCount} Packets
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitRequisition}
              disabled={submitting || !selectedPacket}
              className="w-full bg-brass hover:bg-brass/90 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-md shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 font-sans cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Placing Orders...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Place {deliveryRows.length} Requisition Order{deliveryRows.length > 1 ? "s" : ""}</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-steel italic font-medium">
              Subject to quartermaster approval &amp; ledger logging.
            </p>
          </div>
        </div>
      </div>

      {/* Orders Register Section */}
      <section className="bg-white border-2 border-hairline rounded-lg overflow-hidden shadow-sm mt-12">
        <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
          <h3 className="font-headline font-bold text-xl text-ink-navy">
            Requisition Orders Register ({ordersRegister.length})
          </h3>
          <span className="text-xs text-steel font-medium italic">
            Track status of all requisitions submitted by Unit Command
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-ink-navy text-paper">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Order ID</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Packet Name</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Delivery Location</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Delivery Date</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm text-ink-navy font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-steel italic text-sm">
                    Loading unit requisition register...
                  </td>
                </tr>
              ) : ordersRegister.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-steel italic text-sm">
                    No requisition orders found.
                  </td>
                </tr>
              ) : (
                ordersRegister.map((ord) => (
                  <tr key={ord.id} className="hover:bg-paper/30 transition-colors">
                    <td className="px-6 py-4 font-data-mono font-bold text-brass text-base">{ord.orderCode}</td>
                    <td className="px-6 py-4 font-bold text-ink-navy">{ord.packetName}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-steel">{ord.location}</td>
                    <td className="px-6 py-4 font-data-mono text-delivery-blue font-bold text-xs">{ord.deliveryDate}</td>
                    <td className="px-6 py-4 font-data-mono font-bold text-center text-base">{ord.qty}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-brass/10 text-brass border border-brass/30">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
