"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPacketRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/packets");
  }, [router]);

  return (
    <div className="p-8 text-center text-steel italic text-sm font-sans">
      Redirecting to Packets...
    </div>
  );
}
