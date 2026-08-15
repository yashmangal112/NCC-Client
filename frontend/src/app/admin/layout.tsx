import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="bg-background text-on-background font-body-md min-h-screen">
        <AdminSidebar />
        <main className="ml-[240px] flex flex-col min-h-screen">
          <AdminHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <AdminFooter />
        </main>
      </div>
    </AuthGuard>
  );
}
