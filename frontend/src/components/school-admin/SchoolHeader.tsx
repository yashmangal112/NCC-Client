"use client";

import React, { useState, useEffect } from "react";
import { getAuthUser } from "@/lib/auth";

export default function SchoolHeader() {
  const [schoolTitle, setSchoolTitle] = useState<string>("School Administration");

  useEffect(() => {
    const user = getAuthUser();
    if (user?.schoolName) {
      setSchoolTitle(user.schoolName);
    } else if (user?.name) {
      setSchoolTitle(user.name);
    }
  }, []);

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-paper border-b border-hairline sticky top-0 z-40 font-sans">
      <div className="flex items-center space-x-6">
        <div className="text-xl text-ink-navy font-headline font-bold">
          {schoolTitle} — Requisition Portal
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
            help_outline
          </button>
        </div>
      </div>
    </header>
  );
}
