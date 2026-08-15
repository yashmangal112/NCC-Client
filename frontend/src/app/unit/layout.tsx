import React from "react";
import UnitSidebar from "@/components/unit/UnitSidebar";
import UnitHeader from "@/components/unit/UnitHeader";
import AuthGuard from "@/components/auth/AuthGuard";

export default function UnitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="bg-[#F7F5EF] min-h-screen text-on-surface font-sans antialiased flex">
        <UnitSidebar />
        <main className="ml-[230px] flex-1 flex flex-col min-h-screen">
          <UnitHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
