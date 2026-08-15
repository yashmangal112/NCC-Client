"use client";

import React from "react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto px-container-padding py-stack-md bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
      <p className="text-[10px] font-data-mono text-on-surface-variant uppercase tracking-widest">
        System Status: Operative • Auth Token Active • Ledger Sync: 100%
      </p>
      <div className="flex gap-4">
        <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
          Archive V4.1.2
        </span>
        <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">
          Institutional Record
        </span>
      </div>
    </footer>
  );
}
