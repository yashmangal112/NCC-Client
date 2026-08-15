"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  GraduationCap,
  ShoppingCart,
  Calendar,
  BarChart3,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import { clearAuthSession } from "@/lib/auth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vendor Master", href: "/vendors", icon: Store },
  { name: "Packets", href: "/packets", icon: Package },
  { name: "Units", href: "/units", icon: Users },
  { name: "Schools", href: "/schools", icon: GraduationCap },
  { name: "Delivery Personnel", href: "/delivery-persons", icon: Truck },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Delivery Calendar", href: "/delivery-calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Extra Features", href: "/tools", icon: Wrench },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearAuthSession();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-primary flex flex-col border-r border-outline/20 z-50 font-sans">
      <div className="px-6 py-8">
        <h1 className="font-headline-md text-headline-md text-on-primary tracking-tight">
          Procurement Ledger
        </h1>
        <p className="font-label-caps text-label-caps text-on-primary-fixed-variant opacity-70 mt-1 uppercase">
          Enterprise Command
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const IconComponent = item.icon;

          const cleanPath = item.href;
          const internalAdminPath = `/admin${item.href === "/dashboard" ? "" : item.href}`;
          const isActive =
            pathname === cleanPath ||
            pathname === internalAdminPath ||
            (cleanPath !== "/dashboard" &&
              (pathname.startsWith(cleanPath) || pathname.startsWith(internalAdminPath)));

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
              <IconComponent className="w-5 h-5 mr-3" />
              <span className="font-body-md text-body-md">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline/10 bg-primary-container/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center">
            <User className="w-4 h-4 text-on-secondary-container" />
          </div>
          <div>
            <p className="text-on-primary font-body-md text-xs font-semibold">Chief Auditor</p>
            <p className="text-on-primary-fixed-variant text-[10px] uppercase tracking-wider">
              Super Admin
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-on-primary-fixed-variant hover:text-error transition-colors p-2 rounded hover:bg-primary-container/20 cursor-pointer"
          title="Logout Session"
        >
          <span className="material-symbols-outlined text-base">logout</span>
        </button>
      </div>
    </aside>
  );
}