"use client";

import { useState, useEffect } from "react";
import { FiZap, FiMenu, FiX } from "react-icons/fi";
import { NAV_LINKS } from "@/data";
import { QrCode, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAuthModal } from "@/context/auth-modal-context"
import logo from "../../../public/favicon.png";
import Image from "next/image";


export default function Navbar(){
  const { openLogin } = useAuthModal()
  const { user, logout } = useAuth();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-menu")) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]": ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                {/* <FiZap className="text-white text-sm" /> */}
                <Image src={logo} alt="GoBeyondTickets Logo" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-blue-400 to-violet-300 bg-clip-text text-transparent">
              GoBeyondTickets
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a onClick={() => handleScroll(link.label)}
                key={link.label}
                href={link.href}
                className="text-sm text-gray-200 hover:text-white transition-colors duration-200 font-medium tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 profile-menu">
            {!user ? (
                <button onClick={openLogin} className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-violet-500/20">
                  Login
                </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 p-1.5 rounded-full transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </div>
                </button>

                {/* Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl py-2 z-50">

                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.firstName || "User"}
                      </p>
                      <p className="text-xs text-gray-300 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-red-500/20 transition"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-xl px-4 pb-6 pt-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-gray-300 hover:text-white py-2 text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          {!user ? (
              <button onClick={openLogin} className="w-full text-sm font-semibold py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white">
                Login
              </button>
          ) : (
            <button
              onClick={logout}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-red-500/20 text-red-300"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}