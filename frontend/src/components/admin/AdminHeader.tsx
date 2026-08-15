"use client";

import React from "react";

export default function AdminHeader() {
  return (
    <header className="flex justify-between items-center w-full px-container-padding py-stack-md bg-background border-b border-outline-variant sticky top-0 z-40">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="font-headline-md text-headline-md font-bold text-primary">
          Procurement Portal
        </h2>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="w-full bg-white border border-outline-variant rounded-none py-2 pl-10 pr-4 text-body-md focus:ring-1 focus:ring-tertiary-fixed-dim focus:outline-none transition-all text-on-surface"
            placeholder="Search Master Ledger..."
            type="text"
            // TODO: API Integration - Trigger live search / filter against backend API
          />
        </div>
      </div>
      <div className="flex items-center gap-4 text-on-surface-variant">
        <button className="hover:text-primary transition-colors" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="hover:text-primary transition-colors" title="Help & Documentation">
          <span className="material-symbols-outlined">help</span>
        </button>
        <button className="hover:text-primary transition-colors" title="User Profile">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
