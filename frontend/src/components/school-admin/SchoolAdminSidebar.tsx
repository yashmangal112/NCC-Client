"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const schoolNavItems = [
  { name: "Dashboard", href: "/school-admin", icon: "dashboard" },
  { name: "Event Catalog", href: "/school-admin/catalog", icon: "menu_book" },
  { name: "Place Bulk Order", href: "/school-admin/orders/new", icon: "add_shopping_cart" },
  { name: "Order History & Edit", href: "/school-admin/orders", icon: "receipt_long" },
  { name: "Student Access", href: "/school-admin/students", icon: "group" },
];

export default function SchoolAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-primary flex flex-col border-r border-outline/20 z-50">
      <div className="px-6 py-8">
        <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">
          School Tender Portal
        </h1>
        <p className="font-label-caps text-label-caps text-tertiary-fixed-dim mt-1 uppercase">
          College Principal Panel
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {schoolNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/school-admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 font-semibold transition-all ${
                isActive
                  ? "text-on-primary border-l-2 border-tertiary-fixed-dim bg-primary-container/20"
                  : "text-on-primary-fixed-variant hover:bg-primary-container/10 hover:text-on-primary transition-colors"
              }`}
            >
              <span className="material-symbols-outlined mr-3">{item.icon}</span>
              <span className="font-body-md text-body-md">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline/10 bg-primary-container/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary-fixed text-sm">school</span>
          </div>
          <div>
            <p className="text-on-primary font-body-md text-xs font-semibold">St. Xavier&apos;s Academic</p>
            <p className="text-on-primary-fixed-variant text-[10px] uppercase tracking-wider">
              School Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
