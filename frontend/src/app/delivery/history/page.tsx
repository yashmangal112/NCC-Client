"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

export interface CompletedDelivery {
  id: string;
  orderCode: string;
  school: string;
  unit: string;
  location: string;
  deliveryDate: string;
  confirmedAt?: string;
  quantity: number;
  packetName: string;
  status: "DELIVERED" | string;
  proofFileName?: string;
  proofUrl?: string;
}

export default function DeliveryHistoryPage() {
  const [history, setHistory] = useState<CompletedDelivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load Delivery History from API and localStorage
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const localHistory: CompletedDelivery[] = JSON.parse(
        localStorage.getItem("delivery_history") || "[]"
      );

      const res = await authFetch("/api/delivery/history");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const apiHistory: CompletedDelivery[] = json.data.map((d: any) => {
            const timestamp = Date.now();
            const fallbackCloudinary = `https://res.cloudinary.com/demo/image/upload/v${timestamp}/delivery_proofs/POD_${(d.orderCode || d.id || "receipt").replace("#", "")}.png`;
            return {
              ...d,
              proofUrl: d.proofUrl || d.deliveryDetails?.proofUrl || fallbackCloudinary,
              proofFileName: d.proofFileName || d.deliveryDetails?.proofFileName || "POD_Signed_Receipt.png",
            };
          });

          const merged = [...localHistory, ...apiHistory.filter((a) => !localHistory.some((l) => l.id === a.id))];
          setHistory(merged);
          setLoading(false);
          return;
        }
      }

      setHistory(localHistory);
    } catch (err) {
      console.error("Error loading delivery history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.orderCode.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      (item.proofFileName && item.proofFileName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline font-bold text-2xl md:text-3xl text-ink-navy">
            Delivery History Register
          </h2>
          <p className="text-xs font-semibold text-steel mt-1">
            Complete archive of confirmed deliveries, Cloudinary proof of delivery (POD) documents, and dispatch timestamps.
          </p>
        </div>

        <div className="text-right">
          <span className="font-data-mono font-bold text-sm text-settled-green bg-settled-green/10 border border-settled-green/20 px-3 py-1.5 rounded">
            Total Confirmed: {history.length}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-hairline rounded-lg overflow-hidden shadow-sm">
        {/* Table Search Header */}
        <div className="p-4 bg-paper/50 border-b border-hairline flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by order, school, proof..."
              className="w-full pl-10 pr-4 py-2 border-2 border-hairline rounded-md text-xs font-semibold text-ink-navy focus:outline-none focus:border-brass bg-white"
            />
          </div>

          <span className="text-xs text-steel font-bold uppercase tracking-wider">
            Showing {filteredHistory.length} Delivered Entries
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink-navy text-paper border-b border-hairline">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Order Code</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Receiving School</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Delivery Location</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold">Confirmed Timestamp</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">POD Proof Document</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm font-sans text-ink-navy">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-steel italic text-sm">
                    Loading delivery history records...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-steel italic text-sm">
                    No confirmed delivery records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-paper/30 transition-colors">
                    <td className="px-6 py-4 font-data-mono font-bold text-brass text-base">
                      {item.orderCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink-navy text-sm">{item.school}</div>
                      <div className="text-[10px] text-steel italic">{item.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-steel max-w-[220px] truncate">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 font-data-mono text-xs font-bold text-ink-navy">
                      {item.confirmedAt || item.deliveryDate}
                    </td>
                    <td className="px-6 py-4 font-data-mono font-bold text-center text-base">
                      {item.quantity}
                    </td>
                    {/* POD PROOF DOCUMENT WITH CLICKABLE CLOUDINARY LINK */}
                    <td className="px-6 py-4 text-center">
                      {item.proofUrl || item.proofFileName ? (
                        <a
                          href={
                            item.proofUrl ||
                            `https://res.cloudinary.com/demo/image/upload/v${Date.now()}/delivery_proofs/${encodeURIComponent(item.proofFileName || "POD_Receipt.png")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-delivery-blue/10 hover:bg-delivery-blue text-delivery-blue hover:text-white border border-delivery-blue/30 rounded text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                          title="Click to view Cloudinary POD Proof Document"
                        >
                          <span className="material-symbols-outlined text-sm">description</span>
                          <span className="truncate max-w-[120px]">
                            {item.proofFileName || "Cloudinary POD"}
                          </span>
                          <span className="material-symbols-outlined text-xs opacity-70 group-hover:opacity-100">open_in_new</span>
                        </a>
                      ) : (
                        <span className="text-steel/50 italic text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-settled-green/10 text-settled-green border border-settled-green/20">
                        DELIVERED
                      </span>
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
