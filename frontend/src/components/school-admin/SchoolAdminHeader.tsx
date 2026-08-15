"use client";

import React from "react";

export default function SchoolAdminHeader() {
  return (
    <header className="flex justify-between items-center w-full px-container-padding py-stack-md bg-background border-b border-outline-variant sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary">
            St. Xavier&apos;s Academic Tender Hub
          </h2>
          <p className="text-xs font-data-mono text-on-surface-variant">
            Active Tender Event: <span className="font-bold text-primary">Winter Uniform Drive 2026</span> (Window closes in 14 days)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-on-surface-variant">
        <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-xs uppercase font-bold">
          Active Campsite: Delhi Regional 2026
        </span>
      </div>
    </header>
  );
}
