"use client";

import React, { useState } from "react";

// TODO: API Integration - Replace mock pricing rules with GET /api/admin/pricing-rules
const initialRules = [
  { id: "PR-101", target: "Institutional Cotton Polo Shirt", minQty: 100, tierPrice: 580, scope: "Global", validUntil: "2026-12-31", status: "Active" },
  { id: "PR-102", target: "Institutional Cotton Polo Shirt", minQty: 500, tierPrice: 520, scope: "Global", validUntil: "2026-12-31", status: "Active" },
  { id: "PR-103", target: "Symposium Refreshment Kit", minQty: 250, tierPrice: 850, scope: "Event (Winter Drive 2026)", validUntil: "2026-04-15", status: "Active" },
];

export default function AdminPricingPage() {
  const [rules] = useState(initialRules);

  return (
    <div className="p-container-padding flex-1">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h3 className="font-display-lg text-display-lg text-primary">Pricing Rules &amp; Tier Breaks</h3>
          <p className="text-on-surface-variant font-body-md italic mt-1">
            Configure volume tier pricing breaks and scope validity windows across global or event-specific institutional tenders.
          </p>
        </div>
        <button
          // TODO: API Integration - Open Pricing Rule Creation Modal
          className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2 hover:bg-primary-container/90 transition-all shadow-sm font-label-caps uppercase font-semibold text-xs"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Volume Tier Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-outline-variant overflow-hidden">
        <div className="p-stack-md bg-surface-container/30 flex justify-between items-center">
          <h5 className="font-label-caps text-label-caps uppercase font-bold tracking-widest text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">payments</span>
            Active Tier Pricing Ledger ({rules.length})
          </h5>
        </div>
        <div className="perforation"></div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant/20">
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Rule Ref</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Target SKU / Bundle</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Min Qty Break</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Tier Unit Price</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Scope</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Validity Window</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-data-mono text-data-mono font-bold text-primary">{rule.id}</td>
                <td className="px-6 py-4 font-body-md font-semibold">{rule.target}</td>
                <td className="px-6 py-4 font-data-mono">{rule.minQty}+ units</td>
                <td className="px-6 py-4 font-data-mono font-bold text-primary">₹{rule.tierPrice}</td>
                <td className="px-6 py-4 font-body-md text-on-surface-variant">{rule.scope}</td>
                <td className="px-6 py-4 font-data-mono text-xs text-on-surface-variant">Until {rule.validUntil}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase">
                    {rule.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
