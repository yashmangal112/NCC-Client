import React from "react";
import SchoolSidebar from "@/components/school-admin/SchoolSidebar";
import SchoolHeader from "@/components/school-admin/SchoolHeader";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="bg-[#F7F5EF] min-h-screen text-on-surface font-sans antialiased flex">
        <SchoolSidebar />
        <main className="ml-[230px] flex-1 flex flex-col min-h-screen">
          <SchoolHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
