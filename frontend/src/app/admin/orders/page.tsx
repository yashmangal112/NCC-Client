"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export type OrderStatus = "PENDING" | "DELIVERED" | "CANCELLED" | "SETTLED";

export interface DeliveryDetails {
  status: string;
  personName: string | null;
  phone: string | null;
  vehicleNo: string | null;
  estimatedDelivery?: string;
  driverId?: string | null;
  proofUrl?: string | null;
  proofFileName?: string | null;
}

export interface PaymentProof {
  paymentUploaded: boolean;
  utrNumber?: string | null;
  paymentProofUrl?: string | null;
  paidAmount?: number;
  paymentUploadedAt?: string;
  paymentVerified: boolean;
}

export interface OrderMasterItem {
  id: string;
  orderNumber: string;
  school: string;
  unit: string;
  placedDate?: string;
  deliveryDate: string;
  location: string;
  packetName?: string;
  totalQty: number;
  totalAmount: number;
  status: OrderStatus;
  officerInCharge?: string;
  internalNote?: string;
  deliveryDetails: DeliveryDetails;
  paymentProof: PaymentProof;
  itemsList?: string[];
}

export interface DeliveryPersonOption {
  id: string;
  fullName: string;
  phone: string;
  vehicleNo?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderMasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("All Units");
  const [selectedSchool, setSelectedSchool] = useState<string>("All Schools");
  const [selectedOrder, setSelectedOrder] = useState<OrderMasterItem | null>(null);

  // Available Unit and School Filter Options
  const [availableUnits, setAvailableUnits] = useState<string[]>(["All Units"]);
  const [availableSchools, setAvailableSchools] = useState<string[]>(["All Schools"]);

  // Available Delivery Personnel for Assignment
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryPersonOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // Payment Receipt Upload Modal State (DOCUMENT COMPULSORY)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [utrInput, setUtrInput] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  // 1. Load Units API & Schools API Filter Options
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [uRes, sRes] = await Promise.all([
          authFetch("/api/admin/units"),
          authFetch("/api/admin/schools"),
        ]);

        if (uRes.ok) {
          const uJson = await uRes.json();
          if (uJson.success && Array.isArray(uJson.data)) {
            const unitNames = uJson.data.map((u: any) => u.name);
            setAvailableUnits(["All Units", ...unitNames]);
          }
        }

        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.success && Array.isArray(sJson.data)) {
            const schoolNames = sJson.data.map((s: any) => s.name);
            setAvailableSchools(["All Schools", ...schoolNames]);
          }
        }
      } catch (err) {
        console.error("Error loading Units & Schools filter options:", err);
      }
    }

    loadFilterOptions();
  }, []);

  // Fetch Delivery Agents list for Super Admin dropdown assignment
  const loadDeliveryAgents = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/delivery-persons");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDeliveryAgents(json.data);
          return;
        }
      }
      setDeliveryAgents([
        { id: "DP-001", fullName: "Ramesh Sharma", phone: "+91 98765 43210", vehicleNo: "DL 01 AB 1234" },
        { id: "DP-002", fullName: "Sunil Verma", phone: "+91 98123 45678", vehicleNo: "DL 03 XY 5678" },
        { id: "DP-003", fullName: "Vikram Singh", phone: "+91 99887 76655", vehicleNo: "DL 08 CD 9012" },
      ]);
    } catch (err) {
      console.error("Error fetching delivery agents:", err);
    }
  }, []);

  // Fetch Orders from Backend API via authFetch
  const loadOrdersData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: OrderMasterItem[] = json.data.map((o: any) => {
            const rawStatus = (o.status || "").toUpperCase();
            let status: OrderStatus = "PENDING";
            if (rawStatus === "DELIVERED" || rawStatus === "SETTLED" || rawStatus === "DISBURSED") {
              status = "DELIVERED";
            } else if (rawStatus === "CANCELLED" || rawStatus === "REJECTED") {
              status = "CANCELLED";
            }

            const timestamp = Date.now();
            const defaultProofUrl =
              o.proofUrl ||
              o.deliveryDetails?.proofUrl ||
              o.proof ||
              null;
            // FLEXIBLE EXTRACTION FOR paymentProofUrl (Handles flat o.paymentProofUrl OR nested o.paymentProof.paymentProofUrl)
            const defaultPaymentUrl =
              o.paymentProofUrl ||
              o.paymentProof?.paymentProofUrl ||
              o.paymentProof?.receiptUrl ||
              o.receiptUrl ||
              (typeof o.paymentProof === "string" ? o.paymentProof : null) ||
              null;
            const utrNo =
              o.utrNumber ||
              o.paymentProof?.utrNumber ||
              null;
            const isPaymentVerified =
              o.paymentVerified ??
              o.paymentProof?.verified ??
              o.paymentProof?.paymentVerified ??
              Boolean(defaultPaymentUrl);
            const isPaymentUploaded =
              o.paymentUploaded ??
              o.paymentProof?.uploaded ??
              o.paymentProof?.paymentUploaded ??
              Boolean(defaultPaymentUrl);


            return {
              id: o.id || o.orderNumber || o.orderCode,
              orderNumber: o.orderNumber || o.orderCode || o.id || `#ORD-${o.id}`,
              school: o.school || o.schoolName || "Direct Unit Requisition",
              unit: o.unit || o.unitName || "4 Delhi BN NCC",
              placedDate: o.placedDate || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today"),
              deliveryDate: o.deliveryDate || "TBD",
              location: o.location || o.deliveryLocation || "Campus Address",
              packetName: o.packetName || o.packet?.name || "Refreshment Packet",
              totalQty: o.totalQty ?? o.quantity ?? o.qty ?? 0,
              totalAmount: o.totalAmount ?? o.amount ?? 0,
              status,
              officerInCharge: o.officerInCharge || o.requisitioner?.name || "Officer In Charge",
              internalNote: o.internalNote || "Requisition logged in central procurement ledger.",
              deliveryDetails: {
                status: o.deliveryDetails?.status || (status === "DELIVERED" ? "Delivered" : "Scheduled"),
                personName: o.deliveryDetails?.personName || o.driverName || null,
                phone: o.deliveryDetails?.phone || o.driverPhone || null,
                vehicleNo: o.deliveryDetails?.vehicleNo || o.vehicleNo || null,
                estimatedDelivery: o.deliveryDetails?.estimatedDelivery || o.deliveryDate || "TBD",
                driverId: o.deliveryDetails?.driverId || o.driverId || null,
                proofUrl: defaultProofUrl,
                proofFileName: o.deliveryDetails?.proofFileName || o.proofFileName || (defaultProofUrl ? "POD_Signed_Receipt.png" : null),
              },
              paymentProof: {
                paymentUploaded: isPaymentUploaded,
                utrNumber: utrNo,
                paymentProofUrl: defaultPaymentUrl,
                paidAmount: o.paidAmount || o.paymentProof?.paidAmount || o.totalAmount || 0,
                paymentUploadedAt: o.paymentUploadedAt || o.paymentProof?.uploadedAt || o.paymentProof?.paymentUploadedAt || o.deliveryDate || "TBD",
                paymentVerified: isPaymentVerified,
              },
              itemsList: Array.isArray(o.itemsList)
                ? o.itemsList
                : Array.isArray(o.packet?.itemsList)
                ? o.packet.itemsList
                : ["Standard Refreshment Packets"],
            };
          });

          setOrders(mapped);
        }
      }
    } catch (err) {
      console.error("Admin Orders API error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrdersData();
    loadDeliveryAgents();
  }, [loadOrdersData, loadDeliveryAgents]);

  // Status Counts
  const counts = {
    All: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesTab = activeTab === "All" || ord.status === activeTab;
    const matchesUnit = selectedUnit === "All Units" || ord.unit === selectedUnit;
    const matchesSchool = selectedSchool === "All Schools" || ord.school === selectedSchool;
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesUnit && matchesSchool && matchesSearch;
  });

  // Open Payment Done Modal
  const handleOpenPaymentModal = (order: OrderMasterItem) => {
    setSelectedOrder(order);
    setReceiptFile(null);
    setUtrInput(order.paymentProof.utrNumber || "");
    setPaymentError("");
    setShowPaymentModal(true);
  };

  // PAYMENT DONE API: MARK PAYMENT COMPLETE (DOCUMENT IS COMPULSORY)
  const handleMarkPaymentComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!receiptFile && !selectedOrder.paymentProof.paymentProofUrl) {
      setPaymentError("Payment Receipt Document file is compulsory for verification.");
      return;
    }

    setSubmitting(true);
    setPaymentError("");

    try {
      let uploadedReceiptUrl = selectedOrder.paymentProof.paymentProofUrl || "";
      if (receiptFile) {
        const uploadResult = await uploadToCloudinary(receiptFile, "payment_receipts");
        uploadedReceiptUrl = uploadResult.secure_url; // extract just the URL string
      }

      const finalUtr = utrInput || selectedOrder.paymentProof.utrNumber || `UTR-${Math.floor(100000 + Math.random() * 900000)}`;

      const encodedId = encodeURIComponent(selectedOrder.id);
      const res = await authFetch(`/api/admin/orders/${encodedId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentUploaded: true,
          paymentVerified: true,
          utrNumber: finalUtr,
          paymentProofUrl: uploadedReceiptUrl,
          paidAmount: selectedOrder.totalAmount,
          paymentUploadedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        setPaymentError(errJson?.error?.message || "Failed to record payment verification.");
        setSubmitting(false);
        return; // stop here — don't touch local state or show success
      }

      const updatedOrder: OrderMasterItem = {
        ...selectedOrder,
        paymentProof: {
          ...selectedOrder.paymentProof,
          paymentUploaded: true,
          paymentVerified: true,
          utrNumber: finalUtr,
          paymentProofUrl: uploadedReceiptUrl,
          paidAmount: selectedOrder.totalAmount,
          paymentUploadedAt: new Date().toLocaleDateString("en-GB"),
        },
      };

      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      setShowPaymentModal(false);
      setReceiptFile(null);
      setUtrInput("");
      alert(`Payment verified & marked COMPLETE for Order ${selectedOrder.orderNumber}! Receipt Document linked.`);
    } catch (err) {
      console.error("Mark Payment Complete API error:", err);
      setPaymentError("Failed to record payment verification.");
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Delivery Person Handler
  const handleAssignAgent = async () => {
    if (!selectedOrder || !selectedAgentId) return;

    const agent = deliveryAgents.find((a) => a.id === selectedAgentId);
    if (!agent) return;

    setAssigning(true);
    try {
      const encodedId = encodeURIComponent(selectedOrder.id);
      const res = await authFetch(`/api/admin/orders/${encodedId}/assign-delivery`, {
        method: "PATCH",
        body: JSON.stringify({
          driverId: agent.id,
          driverName: agent.fullName,
          driverPhone: agent.phone,
          vehicleNo: agent.vehicleNo,
        }),
      });

      if (res.ok) {
        await loadOrdersData();
      }

      const updatedDeliveryDetails: DeliveryDetails = {
        ...selectedOrder.deliveryDetails,
        personName: agent.fullName,
        phone: agent.phone,
        vehicleNo: agent.vehicleNo || null,
        driverId: agent.id,
        status: "Assigned / Out for Delivery",
      };

      const updatedOrder = {
        ...selectedOrder,
        deliveryDetails: updatedDeliveryDetails,
      };

      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      alert(`Successfully assigned ${agent.fullName} to Order ${selectedOrder.orderNumber}`);
    } catch (err) {
      console.error("Assign agent error:", err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-container-padding flex-1 bg-paper/30 relative font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-3xl md:text-4xl font-bold text-ink-navy">
            Master Requisition Orders
          </h1>
          <p className="font-sans text-sm text-steel mt-1 max-w-xl">
            Central ledger of refreshment requisitions, delivery logistics, proof documents, and payment verification records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-brass font-data-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brass animate-ping"></span>
              Syncing Orders API...
            </span>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-hairline p-4 rounded-lg shadow-sm mb-stack-lg flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "PENDING", "DELIVERED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-ink-navy text-white shadow-sm"
                  : "bg-paper text-steel hover:text-ink-navy border border-hairline"
              }`}
            >
              {tab === "All" ? "All Orders" : tab}{" "}
              <span className="ml-1 opacity-75 font-data-mono">
                ({counts[tab as keyof typeof counts] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* Search & Unit / School API Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ref, School, Unit..."
              className="w-full pl-9 pr-3 py-1.5 bg-paper/50 border border-hairline rounded text-xs font-sans text-ink-navy focus:outline-none focus:border-brass"
            />
          </div>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-white border border-hairline rounded px-3 py-1.5 text-xs font-bold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
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
            className="bg-white border border-hairline rounded px-3 py-1.5 text-xs font-bold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
          >
            {availableSchools.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MASTER ORDERS REGISTER TABLE */}
      <div className="bg-white border border-hairline rounded overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead className="bg-paper/60 text-steel font-bold uppercase text-[10px] tracking-wider border-b border-hairline">
            <tr>
              <th className="px-6 py-3.5">Order Ref</th>
              <th className="px-6 py-3.5">School / Unit</th>
              <th className="px-6 py-3.5">Delivery Date</th>
              <th className="px-6 py-3.5 text-right">Quantity</th>
              <th className="px-6 py-3.5 text-right">Total Amount</th>
              <th className="px-6 py-3.5 text-center">Payment Status</th>
              <th className="px-6 py-3.5 text-center">Order Status</th>
              <th className="px-6 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-steel italic">
                  Loading orders ledger...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-steel italic">
                  No orders found matching criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const isDelivered = ord.status === "DELIVERED" || ord.status === "SETTLED";
                const isCancelled = ord.status === "CANCELLED";
                const isPaid = ord.paymentProof.paymentVerified || Boolean(ord.paymentProof.paymentProofUrl);

                return (
                  <tr key={ord.id} className="hover:bg-paper/30 transition-colors">
                    <td className="px-6 py-4 font-data-mono font-bold text-brass text-sm">
                      {ord.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink-navy text-sm">{ord.school}</div>
                      <div className="text-[11px] text-steel font-medium">{ord.unit}</div>
                    </td>
                    <td className="px-6 py-4 font-data-mono text-steel">
                      {ord.deliveryDate}
                    </td>
                    <td className="px-6 py-4 text-right font-data-mono font-bold text-ink-navy">
                      {ord.totalQty} nos
                    </td>
                    <td className="px-6 py-4 text-right font-data-mono font-bold text-brass text-sm">
                      ₹{ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    {/* ALWAYS AVAILABLE PAYMENT STATUS BADGE */}
                    <td className="px-6 py-4 text-center">
                      {isPaid ? (
                        <span className="px-2.5 py-1 bg-settled-green/10 text-settled-green border border-settled-green/30 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          {/* <span className="material-symbols-outlined">verified</span> */}
                          Payment Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenPaymentModal(ord)}
                          className="px-2.5 py-1 bg-brass/10 hover:bg-brass text-brass hover:text-white border border-brass/30 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Mark Payment Complete
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isDelivered ? (
                        <span className="px-2.5 py-1 bg-settled-green/10 text-settled-green border border-settled-green/30 rounded text-[10px] font-bold uppercase tracking-wider">
                          Delivered
                        </span>
                      ) : isCancelled ? (
                        <span className="px-2.5 py-1 bg-alert-rust/10 text-alert-rust border border-alert-rust/30 rounded text-[10px] font-bold uppercase tracking-wider">
                          Cancelled
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-brass/10 text-brass border border-brass/30 rounded text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-paper hover:bg-hairline text-ink-navy border border-hairline rounded font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Inspect / Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* INSPECT ORDER SLIDE-OVER PANEL */}
      {selectedOrder && (
        <>
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-ink-navy/40 backdrop-blur-sm z-40 transition-opacity"
          ></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-hairline shadow-2xl z-50 overflow-y-auto p-8 font-sans space-y-6">
            <div className="flex justify-between items-start border-b border-hairline pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brass block">
                  Requisition Order Profile
                </span>
                <h2 className="font-headline-md text-2xl font-bold text-ink-navy">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-steel hover:text-ink-navy text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* ORDER & PAYMENT STATUS ROW */}
            <div className="bg-paper/40 p-4 rounded-lg border border-hairline flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] text-steel uppercase font-bold block">Order Status</span>
                <span className="font-bold text-ink-navy text-sm">{selectedOrder.status}</span>
              </div>

              {!(selectedOrder.paymentProof.paymentVerified || selectedOrder.paymentProof.paymentProofUrl) ? (
                <button
                  onClick={() => handleOpenPaymentModal(selectedOrder)}
                  className="px-4 py-2 bg-settled-green text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm hover:bg-settled-green/90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  Mark Payment Complete
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-settled-green/10 text-settled-green font-bold text-xs uppercase tracking-wider rounded border border-settled-green/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Payment Verified
                </span>
              )}
            </div>

            {/* ORDER DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-paper/20 rounded border border-hairline">
                <span className="text-steel uppercase font-bold block text-[10px]">Recipient School</span>
                <span className="font-bold text-ink-navy">{selectedOrder.school}</span>
              </div>
              <div className="p-3 bg-paper/20 rounded border border-hairline">
                <span className="text-steel uppercase font-bold block text-[10px]">Command Unit</span>
                <span className="font-bold text-ink-navy">{selectedOrder.unit}</span>
              </div>
              <div className="p-3 bg-paper/20 rounded border border-hairline">
                <span className="text-steel uppercase font-bold block text-[10px]">Total Quantity</span>
                <span className="font-data-mono font-bold text-brass">{selectedOrder.totalQty} nos</span>
              </div>
              <div className="p-3 bg-paper/20 rounded border border-hairline">
                <span className="text-steel uppercase font-bold block text-[10px]">Total Procurement Value</span>
                <span className="font-data-mono font-bold text-brass">₹{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* SHOWCASE PROOF DOCUMENTS (CLEAN LINK BADGES WITHOUT CLOUDINARY IN TEXT) */}
            <div className="space-y-3 border-t border-hairline pt-4">
              <h4 className="font-bold text-ink-navy text-sm uppercase tracking-wider">
                Verification &amp; Document Proofs
              </h4>

              <div className="space-y-2 text-xs">
                {/* Proof of Delivery (POD) Document */}
                <div className="p-3 bg-delivery-blue/10 border border-delivery-blue/30 rounded flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-ink-navy">Proof of Delivery (POD Document)</span>
                    <span className="text-[10px] text-steel">
                      {selectedOrder.deliveryDetails.proofFileName || "Signed POD File"}
                    </span>
                  </div>
                  {selectedOrder.deliveryDetails.proofUrl ? (
                    <a
                      href={selectedOrder.deliveryDetails.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-delivery-blue text-white rounded font-bold text-[10px] uppercase tracking-wider hover:opacity-90 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">description</span>
                      View POD Document ↗
                    </a>
                  ) : (
                    <span className="text-[10px] text-steel italic">Awaiting Field Upload</span>
                  )}
                </div>

                {/* Payment Receipt Document */}
                <div className="p-3 bg-settled-green/10 border border-settled-green/30 rounded flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-ink-navy">Payment Verification Receipt</span>
                    <span className="text-[10px] text-steel">
                      {selectedOrder.paymentProof.utrNumber || "Verified Payment"}
                    </span>
                  </div>
                  {selectedOrder.paymentProof.paymentProofUrl ? (
                    <a
                      href={selectedOrder.paymentProof.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-settled-green text-white rounded font-bold text-[10px] uppercase tracking-wider hover:opacity-90 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">receipt</span>
                      View Receipt ↗
                    </a>
                  ) : (
                    <span className="text-[10px] text-steel italic">Pending Verification Upload</span>
                  )}
                </div>
              </div>
            </div>

            {/* LOGISTICS ASSIGNMENT SECTION */}
            <div className="space-y-3 border-t border-hairline pt-4">
              <h4 className="font-bold text-ink-navy text-sm uppercase tracking-wider">
                Delivery Logistics Assignment
              </h4>

              <div className="flex gap-2">
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="flex-1 bg-paper/40 border border-hairline rounded p-2.5 text-xs font-bold text-ink-navy focus:outline-none focus:border-brass cursor-pointer"
                >
                  <option value="">Select Delivery Agent to Assign...</option>
                  {deliveryAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName} ({agent.phone}) - {agent.vehicleNo || "No Vehicle"}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssignAgent}
                  disabled={assigning || !selectedAgentId}
                  className="px-4 py-2.5 bg-ink-navy text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-ink-navy/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {assigning ? "Assigning..." : "Assign Agent"}
                </button>
              </div>

              {selectedOrder.deliveryDetails.personName && (
                <div className="p-3 bg-paper/30 rounded border border-hairline text-xs flex justify-between">
                  <div>
                    <span className="text-steel block text-[10px] uppercase font-bold">Assigned Personnel</span>
                    <span className="font-bold text-ink-navy">{selectedOrder.deliveryDetails.personName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-steel block text-[10px] uppercase font-bold">Phone / Vehicle</span>
                    <span className="font-data-mono text-steel">{selectedOrder.deliveryDetails.phone} • {selectedOrder.deliveryDetails.vehicleNo}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MARK PAYMENT COMPLETE MODAL (DOCUMENT COMPULSORY) */}
      {showPaymentModal && selectedOrder && (
        <>
          <div
            onClick={() => setShowPaymentModal(false)}
            className="fixed inset-0 bg-ink-navy/40 backdrop-blur-sm z-50 transition-opacity"
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white border-2 border-hairline max-w-md w-full p-6 rounded-lg shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-hairline pb-3">
                <h3 className="font-headline font-bold text-lg text-ink-navy">
                  Mark Payment Complete
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-steel hover:text-ink-navy text-xl cursor-pointer">
                  ×
                </button>
              </div>

              {paymentError && (
                <div className="p-3 bg-alert-rust/10 border border-alert-rust text-alert-rust rounded text-xs font-bold">
                  {paymentError}
                </div>
              )}

              <form onSubmit={handleMarkPaymentComplete} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                    Bank UTR / Transaction Reference No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="e.g. UTR-948201948201"
                    className="w-full border border-hairline rounded p-2.5 text-xs text-ink-navy focus:outline-none focus:border-brass font-data-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-ink-navy tracking-wider mb-1">
                    Upload Payment Receipt Document * (Compulsory)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setReceiptFile(file);
                        setPaymentError("");
                      }
                    }}
                    className="w-full border border-hairline rounded p-2 text-xs text-ink-navy focus:outline-none cursor-pointer"
                  />
                  <span className="text-[10px] text-steel block mt-1">
                    Upload receipt document for verification ledger
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 bg-paper text-ink-navy font-bold text-xs uppercase tracking-wider rounded border border-hairline cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-settled-green text-white font-bold text-xs uppercase tracking-wider rounded shadow-md hover:bg-settled-green/90 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Uploading Document..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
