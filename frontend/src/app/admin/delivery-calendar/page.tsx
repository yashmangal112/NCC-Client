"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth";

export type OrderStatus = "PENDING" | "DELIVERED" | "CANCELLED";

export interface CalendarOrder {
  id: string; // e.g. #ORD-6583
  school: string;
  unit: string;
  deliveryDate: string; // Date string e.g. "2026-08-07" or "14 Nov 2023"
  location: string;
  qty: number;
  totalAmount: number;
  status: OrderStatus;
  officerInCharge?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDeliveryCalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  // Selected Date on Calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Filters & State
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("All Units");
  const [selectedSchool, setSelectedSchool] = useState<string>("All Schools");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<CalendarOrder | null>(null);

  // Available Unit and School Filter Options (Populated from API)
  const [availableUnits, setAvailableUnits] = useState<string[]>(["All Units"]);
  const [availableSchools, setAvailableSchools] = useState<string[]>(["All Schools"]);

  // Fetch Delivery Orders AND Units/Schools list concurrently from Backend API
  const loadDeliveryData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, unitRes, schoolRes] = await Promise.all([
        authFetch("/api/admin/orders"),
        authFetch("/api/admin/units"),
        authFetch("/api/admin/schools"),
      ]);

      const unitsSet = new Set<string>(["All Units"]);
      const schoolsSet = new Set<string>(["All Schools"]);

      // 1. Load Units from Units API
      if (unitRes.ok) {
        const uJson = await unitRes.json();
        if (uJson.success && Array.isArray(uJson.data)) {
          uJson.data.forEach((u: any) => {
            const uName = u.name || u.unitName;
            if (uName) unitsSet.add(uName);
          });
        }
      }

      // 2. Load Schools from Schools API
      if (schoolRes.ok) {
        const sJson = await schoolRes.json();
        if (sJson.success && Array.isArray(sJson.data)) {
          sJson.data.forEach((s: any) => {
            const sName = s.name || s.schoolName;
            if (sName) schoolsSet.add(sName);
          });
        }
      }

      // 3. Load Orders
      if (ordRes.ok) {
        const json = await ordRes.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: CalendarOrder[] = json.data.map((o: any) => {
            const rawStatus = (o.status || "").toUpperCase();
            let status: OrderStatus = "PENDING";
            if (rawStatus === "DELIVERED" || rawStatus === "SETTLED" || rawStatus === "DISBURSED") {
              status = "DELIVERED";
            } else if (rawStatus === "CANCELLED" || rawStatus === "REJECTED") {
              status = "CANCELLED";
            }

            const uName = o.unit || o.unitName || o.unit?.name;
            const sName = o.school || o.schoolName || o.school?.name;
            if (uName) unitsSet.add(uName);
            if (sName) schoolsSet.add(sName);

            return {
              id: o.id || o.orderCode || `#ORD-${o.id}`,
              school: sName || "Direct Unit Order",
              unit: uName || "Command Unit",
              deliveryDate: o.deliveryDate || "TBD",
              location: o.location || o.deliveryLocation || "Campus Address",
              qty: o.totalQty ?? o.quantity ?? o.qty ?? 0,
              totalAmount: o.totalAmount ?? o.amount ?? 0,
              status,
              officerInCharge: o.officerInCharge || o.requisitioner?.name || "Quartermaster",
            };
          });

          setOrders(mapped);
        }
      }

      setAvailableUnits(Array.from(unitsSet));
      setAvailableSchools(Array.from(schoolsSet));
    } catch (err) {
      console.error("Admin Delivery Calendar API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryData();
  }, [loadDeliveryData]);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleResetToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Filtered Orders matching Unit, School, and Search Query
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesUnit = selectedUnit === "All Units" || ord.unit === selectedUnit;
      const matchesSchool = selectedSchool === "All Schools" || ord.school === selectedSchool;
      const matchesSearch =
        ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesUnit && matchesSchool && matchesSearch;
    });
  }, [orders, selectedUnit, selectedSchool, searchQuery]);

  // Calendar Days Grid Construction
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }> = [];

    // Filler cells from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        dateStr: `prev-${i}`,
        dayNumber: 0,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, "0");
      const dayFormatted = String(day).padStart(2, "0");
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Orders matching Selected Date
  const selectedDateOrders = useMemo(() => {
    if (!selectedDateStr || selectedDateStr.startsWith("prev")) return [];

    return filteredOrders.filter((ord) => {
      // Direct YYYY-MM-DD match or date string parse match
      if (ord.deliveryDate === selectedDateStr) return true;

      const orderDateObj = new Date(ord.deliveryDate);
      if (!isNaN(orderDateObj.getTime())) {
        const y = orderDateObj.getFullYear();
        const m = String(orderDateObj.getMonth() + 1).padStart(2, "0");
        const d = String(orderDateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}` === selectedDateStr;
      }
      return false;
    });
  }, [filteredOrders, selectedDateStr]);

  // Format Selected Date Header string (e.g. Wednesday, 07 Aug 2026)
  const formattedSelectedDateHeader = useMemo(() => {
    if (!selectedDateStr || selectedDateStr.startsWith("prev")) return "Select a Date";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    return dateObj.toLocaleDateString("en-US", options);
  }, [selectedDateStr]);

  return (
    <div className="flex flex-col min-h-screen bg-paper/30 font-sans">
      {/* TOP APP BAR / HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-container-padding bg-paper border-b border-hairline sticky top-0 z-40 gap-4 font-sans">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <h1 className="font-headline-md text-2xl font-bold text-ink-navy">
            Delivery Calendar
          </h1>

          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search delivery registers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-hairline rounded text-xs text-ink-navy focus:outline-none focus:border-brass font-sans"
            />
          </div>

          {/* Unit & School Dynamic Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-white border border-hairline rounded text-xs font-sans font-semibold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
            >
              {availableUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-white border border-hairline rounded text-xs font-sans font-semibold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
            >
              {availableSchools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-sans">
          {loading ? (
            <span className="text-brass font-data-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
              Syncing Delivery API...
            </span>
          ) : (
            <span className="text-steel font-bold uppercase tracking-wider">
              System Status: <span className="text-settled-green">Operational</span>
            </span>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden font-sans">
        {/* CALENDAR SECTION */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Month Navigation Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-ink-navy">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <div className="flex border border-hairline rounded bg-white overflow-hidden shadow-sm">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-paper transition-colors border-r border-hairline text-ink-navy cursor-pointer"
                  title="Previous Month"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-paper transition-colors text-ink-navy cursor-pointer"
                  title="Next Month"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
              <button
                onClick={handleResetToday}
                className="px-3.5 py-1.5 border border-hairline rounded bg-white hover:bg-paper transition-colors text-xs font-bold uppercase tracking-wider font-sans text-ink-navy shadow-sm cursor-pointer"
              >
                TODAY
              </button>
            </div>

            <div className="flex items-center gap-2 text-steel text-xs font-sans">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="uppercase font-semibold tracking-wider">Quartermaster Schedule</span>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-paper/60 border-b border-hairline">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center border-r last:border-r-0 border-hairline font-sans text-xs uppercase font-bold text-steel tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {calendarGridDays.map((item, idx) => {
                if (!item.isCurrentMonth) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[110px] p-2 bg-paper/30 border-r border-b border-hairline"
                    ></div>
                  );
                }

                // Check orders due on this day
                const dayOrders = filteredOrders.filter((ord) => {
                  if (ord.deliveryDate === item.dateStr) return true;
                  const dObj = new Date(ord.deliveryDate);
                  if (!isNaN(dObj.getTime())) {
                    const y = dObj.getFullYear();
                    const m = String(dObj.getMonth() + 1).padStart(2, "0");
                    const d = String(dObj.getDate()).padStart(2, "0");
                    return `${y}-${m}-${d}` === item.dateStr;
                  }
                  return false;
                });

                const orderCount = dayOrders.length;
                const isSelected = selectedDateStr === item.dateStr;

                return (
                  <div
                    key={item.dateStr}
                    onClick={() => setSelectedDateStr(item.dateStr)}
                    className={`min-h-[110px] p-3 border-r border-b border-hairline transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? "bg-delivery-blue/10 border-2 border-delivery-blue"
                        : "hover:bg-paper/40 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`font-data-mono text-sm font-bold ${
                          isSelected ? "text-delivery-blue" : "text-ink-navy"
                        }`}
                      >
                        {String(item.dayNumber).padStart(2, "0")}
                      </span>

                      {orderCount > 0 && (
                        <span className="bg-delivery-blue text-white text-[11px] w-5 h-5 flex items-center justify-center rounded-full font-data-mono font-bold shadow-sm">
                          {orderCount}
                        </span>
                      )}
                    </div>

                    {orderCount > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] text-delivery-blue font-bold uppercase font-sans line-clamp-1">
                          {dayOrders[0].school}
                        </div>
                        {orderCount > 1 && (
                          <span className="text-[9px] bg-brass/20 text-brass px-1.5 py-0.5 rounded font-bold uppercase font-sans tracking-widest inline-block">
                            {orderCount} Deliveries
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDE PANEL (Selected Date Details) */}
        <aside className="w-full lg:w-[380px] bg-white border-l border-hairline flex flex-col p-6 shadow-sm font-sans">
          <div className="mb-6">
            <p className="font-sans text-xs uppercase font-bold text-steel tracking-wider mb-1">
              Dispatch Schedule for
            </p>
            <h3 className="font-headline-md text-xl font-bold text-ink-navy">
              {formattedSelectedDateHeader}
            </h3>
            <div className="mt-3 h-px w-full bg-hairline"></div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-steel italic text-sm">
                Loading scheduled deliveries...
              </div>
            ) : selectedDateOrders.length === 0 ? (
              <div className="h-48 border border-dashed border-hairline rounded flex flex-col items-center justify-center p-6 text-center text-steel bg-paper/30">
                <span className="material-symbols-outlined text-3xl mb-2 opacity-40">
                  event_busy
                </span>
                <p className="font-bold text-xs uppercase tracking-wider text-ink-navy">
                  No deliveries scheduled
                </p>
                <p className="text-xs mt-1 italic">
                  There are no active orders due for dispatch on this date.
                </p>
              </div>
            ) : (
              selectedDateOrders.map((ord) => {
                let badgeClass = "bg-brass/10 text-brass border-brass/20";
                if (ord.status === "DELIVERED")
                  badgeClass = "bg-settled-green/10 text-settled-green border-settled-green/20";
                else if (ord.status === "CANCELLED")
                  badgeClass = "bg-alert-rust/10 text-alert-rust border-alert-rust/20";

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="p-4 border border-hairline rounded bg-white hover:border-brass transition-all shadow-sm space-y-3 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-ink-navy font-sans">
                        {ord.school}
                      </h4>
                      <span className="font-data-mono text-xs font-bold text-brass">
                        {ord.id}
                      </span>
                    </div>

                    <div className="text-xs text-steel space-y-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-steel">
                          location_on
                        </span>
                        <span className="truncate">{ord.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-steel">
                          inventory_2
                        </span>
                        <span>
                          Qty:{" "}
                          <strong className="font-data-mono text-ink-navy">
                            {ord.qty} units
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-hairline">
                      <span
                        className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                      >
                        {ord.status}
                      </span>
                      <span className="text-[10px] text-brass font-bold uppercase tracking-wider flex items-center gap-0.5">
                        View Details <span className="material-symbols-outlined text-xs">chevron_right</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-hairline space-y-3">
            <Link
              href="/orders"
              className="w-full border-2 border-ink-navy text-ink-navy hover:bg-ink-navy hover:text-white font-bold py-2.5 rounded text-xs uppercase tracking-widest transition-all font-sans flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              View Master Orders Register
            </Link>
          </div>
        </aside>
      </div>

      {/* DETAIL MODAL FOR SELECTED CALENDAR ENTRY */}
      {selectedOrder && (
        <>
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-ink-navy/30 backdrop-blur-sm z-[55] transition-opacity"
          ></div>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white border border-hairline max-w-md w-full p-6 rounded-lg shadow-2xl space-y-4 font-sans">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <div>
                  <h3 className="font-headline font-bold text-lg text-ink-navy">
                    Scheduled Delivery Details
                  </h3>
                  <p className="font-data-mono text-xs font-bold text-brass mt-0.5">
                    {selectedOrder.id} • {selectedOrder.school}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-steel hover:text-alert-rust p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span className="text-steel uppercase font-bold">Command Unit</span>
                  <span className="font-semibold text-ink-navy">{selectedOrder.unit}</span>
                </div>
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span className="text-steel uppercase font-bold">Delivery Date</span>
                  <span className="font-data-mono font-bold text-delivery-blue">{selectedOrder.deliveryDate}</span>
                </div>
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span className="text-steel uppercase font-bold">Delivery Location</span>
                  <span className="font-semibold text-ink-navy">{selectedOrder.location}</span>
                </div>
                <div className="flex justify-between border-b border-hairline pb-2">
                  <span className="text-steel uppercase font-bold">Quantity Due</span>
                  <span className="font-data-mono font-bold text-ink-navy">{selectedOrder.qty} Packets</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-steel uppercase font-bold">Status</span>
                  <span className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-brass/10 text-brass border border-brass/30">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 bg-paper hover:bg-hairline text-ink-navy font-bold text-xs uppercase tracking-wider rounded border border-hairline cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/orders"
                  className="flex-1 py-2 bg-ink-navy text-white text-center font-bold text-xs uppercase tracking-wider rounded hover:bg-ink-navy/90 cursor-pointer"
                >
                  Go to Orders
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
