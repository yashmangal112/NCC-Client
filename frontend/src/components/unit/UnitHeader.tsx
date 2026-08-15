"use client";

import React, { useState, useEffect } from "react";
import { getAuthUser } from "@/lib/auth";

export default function UnitHeader() {
  const [unitTitle, setUnitTitle] = useState<string>("Unit Command");

  useEffect(() => {
    const user = getAuthUser();
    if (user?.unitName) {
      setUnitTitle(user.unitName);
    } else if (user?.name) {
      setUnitTitle(user.name);
    }
  }, []);

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-paper border-b border-hairline sticky top-0 z-40 font-sans">
      <div className="flex items-center space-x-6">
        <div className="text-xl text-ink-navy font-headline font-bold">
          {unitTitle} — Refreshment Requisition
        </div>
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-steel text-sm">
            search
          </span>
          <input
            className="bg-white border border-hairline rounded-sm pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-brass w-64 placeholder:text-steel/50 font-sans text-ink-navy"
            placeholder="Search orders or units..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 text-steel hover:text-brass transition-colors px-3 py-1 border border-hairline rounded-sm bg-white text-[10px] font-bold uppercase tracking-wider">
          <span
            className="material-symbols-outlined text-[10px] text-settled-green"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            circle
          </span>
          <span>System Status</span>
        </button>
        <div className="flex items-center space-x-2 border-l border-hairline pl-4 text-steel">
          <button className="material-symbols-outlined hover:text-brass transition-colors p-1 text-lg">
            notifications
          </button>
          <button className="material-symbols-outlined hover:text-brass transition-colors p-1 text-lg">
            settings
          </button>
          <button className="material-symbols-outlined hover:text-brass transition-colors p-1 text-lg">
            help_outline
          </button>
        </div>
      </div>
    </header>
  );
}
