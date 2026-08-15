"use client";

import React from "react";

export default function StudentHeader() {
  return (
    <header className="flex justify-between items-center w-full px-container-padding py-stack-md bg-background border-b border-outline-variant sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary">
            Student Merchandise Portal
          </h2>
          <p className="text-xs font-data-mono text-on-surface-variant">
            St. Xavier&apos;s Academic • Event: <span className="font-bold text-primary">Winter Uniform Drive 2026</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant font-label-caps text-xs uppercase font-bold">
          View-Only Student Access
        </span>
      </div>
    </header>
  );
}
