"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function AuthCallback() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      // AuthContext already called verifyAuth on mount
      // so user is already set by now
      const redirectUrl = sessionStorage.getItem("redirectUrl") || "/";
      sessionStorage.removeItem("redirectUrl");
      router.replace(redirectUrl);
    }
  }, [loading, user]);

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}