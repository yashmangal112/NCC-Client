"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken, clearAuthSession } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      clearAuthSession();
      window.location.href = "/login";
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-ink-navy">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brass border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase font-bold tracking-widest text-steel font-data-mono">
            Verifying Institutional Authorization...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
