"use client";

import React, { useState } from "react";

// TODO: API Integration - Replace mock pending payments with GET /api/admin/payments/pending
const initialPendingPayments = [
  {
    id: "PAY-1001",
    orderId: "ORD-99198",
    institute: "IIT Bombay Lab Div.",
    event: "Q4 Lab Replenishment",
    amount: "₹1,12,000.00",
    proofDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    submittedDate: "2026-08-01 14:30",
    status: "Pending Review",
  },
  {
    id: "PAY-1002",
    orderId: "ORD-99205",
    institute: "Modern High School Pune",
    event: "Winter Uniform Drive 2026",
    amount: "₹78,400.00",
    proofDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    submittedDate: "2026-08-01 16:10",
    status: "Pending Review",
  },
];

// TODO: API Integration - Replace mock settled payments with GET /api/admin/payments/settled
const initialSettledPayments = [
  { id: "PAY-0982", orderId: "ORD-99172", institute: "SRM University", amount: "₹14,900.00", approvedBy: "Chief Auditor", date: "2026-07-29", status: "Approved" },
];

export default function AdminPaymentsPage() {
  const [pending, setPending] = useState(initialPendingPayments);
  const [settled, setSettled] = useState(initialSettledPayments);
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = (item: any) => {
    // TODO: API Integration - Trigger POST /api/admin/payments/:id/approve
    setPending(pending.filter((p) => p.id !== item.id));
    setSettled([
      {
        id: item.id,
        orderId: item.orderId,
        institute: item.institute,
        amount: item.amount,
        approvedBy: "Chief Auditor",
        date: new Date().toISOString().split("T")[0],
        status: "Approved",
      },
      ...settled,
    ]);
    setSelectedProof(null);
    alert(`Payment ${item.id} Approved! Order ${item.orderId} is now marked Payment Approved and eligible for dispatch.`);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProof) return;
    // TODO: API Integration - Trigger POST /api/admin/payments/:id/reject { reason }
    setPending(pending.filter((p) => p.id !== selectedProof.id));
    setShowRejectModal(false);
    setSelectedProof(null);
    setRejectionReason("");
    alert(`Payment proof rejected. Notification sent back to School Admin.`);
  };

  return (
    <div className="p-container-padding flex-1">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h3 className="font-display-lg text-display-lg text-primary">Payment Settlement Queue</h3>
          <p className="text-on-surface-variant font-body-md italic mt-1">
            Reconcile offline bank transfer screenshots / receipts uploaded by School Admins before authorizing dispatch.
          </p>
        </div>
      </div>

      {/* Pending Approval Queue */}
      <div className="bg-white border border-outline-variant mb-stack-lg overflow-hidden">
        <div className="p-stack-md bg-surface-container/30 flex justify-between items-center border-l-4 border-l-tertiary-fixed-dim">
          <h5 className="font-label-caps text-label-caps uppercase font-bold tracking-widest text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            Pending Approval Queue ({pending.length})
          </h5>
          <span className="text-xs font-label-caps uppercase text-error font-bold">Action Required</span>
        </div>
        <div className="perforation"></div>

        {pending.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-md italic">
            No pending payment proofs requiring review. All uploads settled.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/20">
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Order Ref</th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Institute</th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Submitted Date</th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Proof Document</th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {pending.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-data-mono font-bold text-primary">{item.orderId}</td>
                  <td className="px-6 py-4 font-body-md font-semibold">{item.institute}</td>
                  <td className="px-6 py-4 font-data-mono font-bold text-primary">{item.amount}</td>
                  <td className="px-6 py-4 font-data-mono text-xs text-on-surface-variant">{item.submittedDate}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProof(item)}
                      className="border border-primary text-primary px-3 py-1 text-xs font-label-caps uppercase hover:bg-primary hover:text-on-primary"
                    >
                      Inspect Receipt Document
                    </button>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(item)}
                      className="bg-primary text-on-primary px-3 py-1 text-xs font-label-caps uppercase hover:bg-primary-container"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProof(item);
                        setShowRejectModal(true);
                      }}
                      className="bg-error text-on-error px-3 py-1 text-xs font-label-caps uppercase hover:bg-error/90"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Document Inspector Drawer/Modal */}
      {selectedProof && !showRejectModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant max-w-xl w-full p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
              <h4 className="font-headline-md text-primary">Payment Proof Document Inspector</h4>
              <button onClick={() => setSelectedProof(null)} className="text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-data-mono bg-surface-container-low p-3 border border-outline-variant">
                <div>
                  <span className="text-on-surface-variant uppercase">Order Ref:</span> {selectedProof.orderId}
                </div>
                <div>
                  <span className="text-on-surface-variant uppercase">Amount:</span> {selectedProof.amount}
                </div>
                <div className="col-span-2">
                  <span className="text-on-surface-variant uppercase">Institute:</span> {selectedProof.institute}
                </div>
              </div>
              <div className="border border-outline-variant h-64 overflow-hidden relative flex items-center justify-center bg-surface-container-highest">
                <img
                  src={selectedProof.proofDocumentUrl}
                  alt="Payment Receipt Screenshot"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button onClick={() => setSelectedProof(null)} className="px-4 py-2 text-xs border border-outline-variant">
                Close
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(true);
                }}
                className="px-4 py-2 text-xs bg-error text-on-error font-label-caps uppercase"
              >
                Reject Proof
              </button>
              <button
                onClick={() => handleApprove(selectedProof)}
                className="px-4 py-2 text-xs bg-primary text-on-primary font-label-caps uppercase"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedProof && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant max-w-md w-full p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
              <h4 className="font-headline-md text-error">Reject Payment Proof</h4>
              <button onClick={() => setShowRejectModal(false)} className="text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleReject} className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                Provide a reason for rejection. Order {selectedProof.orderId} will remain in &quot;Editable-Pending-Payment&quot; state for the School Admin to re-upload.
              </p>
              <textarea
                required
                rows={3}
                placeholder="e.g. Transaction Reference number unreadable / Amount does not match invoice total."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant p-2 text-xs"
              ></textarea>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-xs border border-outline-variant">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs bg-error text-on-error font-label-caps uppercase font-semibold">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settled Payments Log */}
      <div className="bg-white border border-outline-variant overflow-hidden">
        <div className="p-stack-md bg-surface-container/30 flex justify-between items-center">
          <h5 className="font-label-caps text-label-caps uppercase font-bold tracking-widest text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            Settled Payments Log ({settled.length})
          </h5>
        </div>
        <div className="perforation"></div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant/20">
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Payment Ref</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Order Ref</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Institute</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Amount</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Approved By</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Approval Date</th>
              <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {settled.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-data-mono font-bold text-primary">{s.id}</td>
                <td className="px-6 py-4 font-data-mono">{s.orderId}</td>
                <td className="px-6 py-4 font-body-md font-semibold">{s.institute}</td>
                <td className="px-6 py-4 font-data-mono font-bold text-primary">{s.amount}</td>
                <td className="px-6 py-4 font-body-md text-on-surface-variant">{s.approvedBy}</td>
                <td className="px-6 py-4 font-data-mono text-xs">{s.date}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase">
                    {s.status}
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
