"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch, getAuthUser } from "@/lib/auth";

export interface RequisitionPacketOption {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  itemsList: string[];
  icon: string;
}

export interface SchoolPlacedOrder {
  id: string;
  orderCode: string;
  packetName: string;
  location: string;
  deliveryDate: string;
  qty: number;
  status: "PENDING" | "DELIVERED" | "CANCELLED" | string;
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

export default function SchoolOrdersPage() {
  const [packetOptions, setPacketOptions] = useState<RequisitionPacketOption[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<RequisitionPacketOption | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(100);
  const [mappedUnitId, setMappedUnitId] = useState<string | null>(null);
  
  // Dynamic Initial Date in YYYY-MM-DD format to prevent timezone offset bugs
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [ordersRegister, setOrdersRegister] = useState<SchoolPlacedOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string>("");
  const [orderErrorMsg, setOrderErrorMsg] = useState<string>("");

  // Fetch available Packets & Placed Orders via authFetch
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 0. Fetch dashboard profile if needed for unitId mapping
      const profileRes = await authFetch("/api/school-admin/dashboard");
      if (profileRes.ok) {
        const pJson = await profileRes.json();
        if (pJson.data?.unitId || pJson.data?.unit?.id) {
          setMappedUnitId(pJson.data.unitId || pJson.data.unit?.id);
        }
      }

      // 1. Fetch available packets for this school
      const pktRes = await authFetch("/api/school-admin/packets");
      if (pktRes.ok) {
        const pktJson = await pktRes.json();
        if (pktJson.success && Array.isArray(pktJson.data)) {
          const mappedPackets: RequisitionPacketOption[] = pktJson.data.map((p: any) => ({
            id: p.id || p.packetCode,
            name: p.name,
            description: p.description || `${p.itemCount} Item Bundle`,
            itemCount: p.itemCount || 1,
            itemsList: Array.isArray(p.itemsList) ? p.itemsList : [],
            icon: p.icon || "inventory_2",
          }));
          setPacketOptions(mappedPackets);
          if (mappedPackets.length > 0) {
            setSelectedPacket(mappedPackets[0]);
          }
        }
      }

      // 2. Fetch placed orders history for this school
      const ordRes = await authFetch("/api/school-admin/orders");
      if (ordRes.ok) {
        const ordJson = await ordRes.json();
        if (ordJson.success && Array.isArray(ordJson.data)) {
          const mappedOrders: SchoolPlacedOrder[] = ordJson.data.map((o: any) => {
            const rawStatus = (o.status || "").toUpperCase();
            let status = "PENDING";
            if (rawStatus === "DELIVERED" || rawStatus === "SETTLED") status = "DELIVERED";
            else if (rawStatus === "CANCELLED") status = "CANCELLED";

            return {
              id: o.id,
              orderCode: o.orderCode || o.code || `#ORD-${o.id}`,
              packetName: o.packetName || o.packet?.name || "Refreshment Packet",
              location: o.location || o.deliveryLocation || "School Campus",
              deliveryDate: o.deliveryDate || "TBD",
              qty: o.quantity || o.qty || 0,
              status,
            };
          });
          setOrdersRegister(mappedOrders);
        }
      }
    } catch (err) {
      console.error("School Orders API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateQty = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  // Submit Requisition using authFetch
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPacket) {
      alert("Please select a packet type.");
      return;
    }
    if (!deliveryLocation.trim()) {
      alert("Please enter a valid delivery location.");
      return;
    }

    setSubmitting(true);
    setOrderSuccessMsg("");
    setOrderErrorMsg("");

    const payload: any = {
      packetId: selectedPacket.id,
      packetName: selectedPacket.name,
      location: deliveryLocation,
      quantity,
      deliveryDate,
    };

    if (mappedUnitId) {
      payload.unitId = mappedUnitId;
    }

    try {
      const res = await authFetch("/api/school-admin/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOrderSuccessMsg("Requisition submitted successfully!");
        await loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setOrderErrorMsg(errJson.error?.message || "Failed to submit requisition order.");
      }
    } catch (err: any) {
      console.error("Submit Requisition API error:", err);
      setOrderErrorMsg("Failed to connect to backend service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex-1 bg-paper/40 font-sans space-y-8">
      {/* Top Title Bar */}
      <div>
        <h2 className="font-headline font-bold text-3xl md:text-4xl text-ink-navy mb-1">
          Place School Requisition &amp; Order Tracking
        </h2>
        <p className="text-sm font-semibold text-steel">
          Requisition refreshment packets for upcoming institutional activities.
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
        <div className="flex-1 space-y-8 w-full max-w-[44rem]">
          {/* Section 1: Select a Packet Type (WITH HORIZONTAL SCROLL) */}
          <section className="bg-white border-2 border-hairline rounded-lg p-6 shadow-sm">
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-ink-navy font-bold border-b border-hairline pb-3 mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brass text-base">inventory_2</span>
                1. Select a Packet Type
              </span>
              <span className="text-[10px] text-steel font-sans font-normal italic">
                Scroll horizontally to view all available packets →
              </span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-steel italic text-sm">
                Loading available refreshment packets...
              </div>
            ) : packetOptions.length === 0 ? (
              <div className="p-8 text-center text-steel italic text-sm">
                No refreshment packets available for this school.
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-5 pb-4 snap-x scrollbar-thin scrollbar-thumb-brass">
                {packetOptions.map((pkt) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  return (
                    <div
                      key={pkt.id}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`min-w-[280px] max-w-[320px] shrink-0 border-2 rounded-lg p-5 cursor-pointer transition-all relative flex flex-col justify-between snap-start ${
                        isSelected
                          ? "bg-brass/5 border-brass shadow-md ring-2 ring-brass"
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
                        <div className="p-3 bg-paper rounded-md w-fit mb-3 text-ink-navy border border-hairline flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-brass">
                            {pkt.icon || "local_cafe"}
                          </span>
                        </div>
                        <h4 className="font-headline font-bold text-ink-navy text-lg">
                          {pkt.name}
                        </h4>
                        <p className="text-xs font-medium text-steel mt-1.5 leading-relaxed line-clamp-2">
                          {pkt.description}
                        </p>
                      </div>

                      {/* Included SKUs Breakdown Tags */}
                      {pkt.itemsList && pkt.itemsList.length > 0 && (
                        <div className="mb-4 space-y-1 bg-paper/40 p-2.5 rounded border border-hairline">
                          <span className="text-[10px] uppercase font-bold text-steel block">
                            Included Items ({pkt.itemsList.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {pkt.itemsList.map((item, iIdx) => (
                              <span
                                key={iIdx}
                                className="px-2 py-0.5 bg-white border border-hairline rounded text-[10px] text-ink-navy font-semibold"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-hairline pt-3 mt-auto flex justify-between items-center text-xs">
                        <span className="font-bold text-ink-navy font-sans">
                          {pkt.itemCount} items
                        </span>
                        <span className="font-bold text-brass text-xs uppercase tracking-wider">
                          Standard Bundle
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Delivery Details */}
          <section className="bg-white border-2 border-hairline rounded-lg p-6 shadow-sm space-y-6">
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-ink-navy font-bold border-b border-hairline pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-brass text-base">local_shipping</span>
              2. Delivery Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2 font-sans">
                  Delivery Location *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-steel text-lg">
                    location_on
                  </span>
                  <input
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-hairline rounded-md focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass text-sm font-semibold text-ink-navy bg-white shadow-sm font-sans"
                    placeholder="Enter school campus / delivery address..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2 font-sans">
                  Requisition Quantity *
                </label>
                <div className="flex border-2 border-hairline rounded-md w-full overflow-hidden shadow-sm h-[46px] bg-white">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(-10)}
                    className="px-4 bg-paper hover:bg-brass hover:text-white text-ink-navy font-bold text-lg border-r-2 border-hairline transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                    title="Decrease Quantity"
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">remove</span>
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 min-w-0 text-center border-none focus:ring-0 font-data-mono font-bold text-xl text-ink-navy bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(10)}
                    className="px-4 bg-paper hover:bg-brass hover:text-white text-ink-navy font-bold text-lg border-l-2 border-hairline transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
                    title="Increase Quantity"
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Date Calendar Widget (Blocked Past Dates & Timezone Safe) */}
            <div>
              <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-2 font-sans">
                Required Delivery Date * ({deliveryDate})
              </label>
              
              <CalendarPicker
                selectedDate={deliveryDate}
                onSelectDate={(date) => setDeliveryDate(date)}
              />
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

              <div className="flex justify-between items-center text-steel">
                <span className="font-bold text-steel">Quantity</span>
                <span className="font-data-mono font-bold text-brass text-base">{quantity} pkts</span>
              </div>

              <div className="flex justify-between items-center text-steel">
                <span className="font-bold text-steel">Delivery Date</span>
                <span className="font-bold text-ink-navy text-xs">{deliveryDate}</span>
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
                  <span>Submitting Requisition...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Submit Requisition</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-steel italic font-medium">
              Subject to quartermaster approval.
            </p>
          </div>
        </div>
      </div>

      {/* Orders Register Section */}
      <section className="bg-white border-2 border-hairline rounded-lg overflow-hidden shadow-sm mt-12">
        <div className="px-6 py-4 bg-paper/40 border-b border-hairline flex justify-between items-center">
          <h3 className="font-headline font-bold text-xl text-ink-navy">
            School Requisition History ({ordersRegister.length})
          </h3>
          <span className="text-xs text-steel font-medium italic">
            Track status of all requisitions submitted by this School
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
                    Loading school requisition history...
                  </td>
                </tr>
              ) : ordersRegister.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-steel italic text-sm">
                    No requisition orders found.
                  </td>
                </tr>
              ) : (
                ordersRegister.map((ord) => {
                  let badgeClass = "bg-brass/10 text-brass border-brass/20";
                  if (ord.status === "DELIVERED") badgeClass = "bg-settled-green/10 text-settled-green border-settled-green/20";
                  else if (ord.status === "CANCELLED") badgeClass = "bg-alert-rust/10 text-alert-rust border-alert-rust/20";

                  return (
                    <tr key={ord.id} className="hover:bg-paper/30 transition-colors">
                      <td className="px-6 py-4 font-data-mono font-bold text-brass text-base">{ord.orderCode}</td>
                      <td className="px-6 py-4 font-bold text-ink-navy">{ord.packetName}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-steel">{ord.location}</td>
                      <td className="px-6 py-4 font-data-mono text-delivery-blue font-bold text-xs">{ord.deliveryDate}</td>
                      <td className="px-6 py-4 font-data-mono font-bold text-center text-base">{ord.qty}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${badgeClass}`}>
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
    </div>
  );
}
