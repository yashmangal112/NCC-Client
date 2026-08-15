"use client";

import React, { useState, useEffect } from "react";
import { setAuthSession } from "@/lib/auth";

const SLIDES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDZLDelBBdTfXLDyAj--J6hTRFGF9nJdpi7NAuh7T5GS0a3feABPqEWcTTYXaUZ-OcaH8qjLtdqSwgnM2h3-QqoG4_eHP6vfUnzPfuqkvY7krSDkr0Z4diZFgm3UEr864lbXigaRaLJBkrp7ITmK4nC1dDOkrYyNxhB3GcZYLbEmilGBPB9YWNSMocpdcm-GKwTQlJdyFkyAUnewD9deDB68LGDTsQ23Bsgdkdwj2sje_15_aG65Eevijg_VITEV7zwKig",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3ieexi92JgiTNqQnbGsuOPi7NnzQScFb-i0vYizzK65GiyUaKUrDDOcTdyRlH6-PhtYuYIOfWCmr3GypMItjdEAdmj0vfwqy1Tp3XCpApxwIfUKKI8oTKJqBvZCK0NkZ1bf73pYflJg4pT0Fq2G-Ma38RAah7eAWnZdT7zAjgueVcqen9HzWXiSGCNdB1ioK_1ieJqvEl_2CTjfzLL6okiXqOQZijJE87AVNZ17XCejpzT7yPdemZhb2xlZ1mn-RuA5c",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDp808tF5gQA-Xs0fSbWbz39HH-K-E3-_uOEoZsZRa-UBXXHQMfkghSXN-7O0ZCBkRdew7OL7ZAy1U7zCM5yvfRFLB9rO2UI09ceucVY8QGSh0viqrYsAuwHPylSHRrDDaZ-ycPD1mVQVfmN2n4u1Wmd5PXyiTUYQ3bAtq4PKExg65_oXixiGJXHzAjLMi6RrPn_q0HTh2YJ97d1DtCN1m97HK_doAAFQloVZljz9Cibj9N2bXuW9z_UUKQbwS9lWqiDBE",
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Background Slideshow Timer (Change image every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // API Call: POST /api/auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && json.data?.token) {
        const user = json.data.user || {};
        const rawRole = (user.role || "").toUpperCase();

        let roleKey = "admin";
        if (
          user.isDelivery ||
          rawRole === "DELIVERY" ||
          rawRole === "DELIVERY_PERSON" ||
          rawRole === "DRIVER"
        ) {
          roleKey = "delivery";
        } else if (
          user.isUnit ||
          rawRole === "UNIT" ||
          rawRole === "UNIT_OFFICER"
        ) {
          roleKey = "unit";
        } else if (
          user.isSchool ||
          rawRole === "SCHOOL-ADMIN" ||
          rawRole === "SCHOOL_ADMIN"
        ) {
          roleKey = "school-admin";
        } else if (
          user.isAdmin ||
          rawRole === "ADMIN" ||
          rawRole === "SUPER_ADMIN"
        ) {
          roleKey = "admin";
        }

        setAuthSession(json.data.token, roleKey, user);
        setLoading(false);

        // Redirect based on user role
        if (roleKey === "admin") {
          window.location.href = "/admin";
        } else if (roleKey === "unit") {
          window.location.href = "/unit";
        } else if (roleKey === "school-admin") {
          window.location.href = "/school-admin";
        } else if (roleKey === "delivery") {
          window.location.href = "/delivery";
        } else {
          window.location.href = "/admin";
        }
        return;
      }

      const errMessage =
        json.error?.message ||
        json.message ||
        "Invalid official email or security passcode. Please check your credentials.";

      setErrorMsg(errMessage);
      setLoading(false);
    } catch (err: any) {
      console.warn("Backend login server unreachable:", err);
      setErrorMsg(
        "Backend server is offline or unreachable. Please verify your connection."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-body-md text-on-surface p-gutter relative overflow-hidden select-none">
      {/* Background Slideshow */}
      <div className="slideshow-container">
        {SLIDES.map((slideUrl, idx) => (
          <div
            key={idx}
            className={`slide ${idx === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url('${slideUrl}')` }}
          />
        ))}
        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1A14]/70 via-[#0E1A14]/60 to-[#0E1A14]/80 z-10 backdrop-blur-2xs"></div>
      </div>

      {/* Top Branding Anchor */}
      <header className="mb-stack-md text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* Substituted simple crest representation with NCC colors */}
          <div className="flex h-12 w-12 rounded-full overflow-hidden border-2 border-brass shadow-lg">
            <div className="flex-1 bg-ncc-red"></div>
            <div className="flex-1 bg-ncc-navy"></div>
            <div className="flex-1 bg-ncc-sky"></div>
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-white uppercase tracking-wider drop-shadow-md">
          Quartermaster&apos;s Register
        </h1>
        <p className="font-label-caps text-label-caps text-paper opacity-90 mt-2 tracking-widest drop-shadow-sm">
          National Cadet Corps - Supply Division
        </p>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-[440px] glass-card rounded-lg overflow-hidden relative z-10 shadow-2xl">
        {/* Card Header */}
        <div className="bg-ink-navy/90 py-stack-md px-container-padding text-center border-b border-brass/30">
          <h2 className="font-headline-md text-headline-md text-paper font-medium">
            Log Requisition
          </h2>
          <p className="font-body-sm text-body-sm text-paper opacity-80">
            Credential Verification Process
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLogin} className="p-container-padding space-y-6 bg-paper/50">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 bg-alert-rust/10 border border-alert-rust text-alert-rust rounded-lg text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label
              className="block font-label-caps text-label-caps text-ink-navy uppercase"
              htmlFor="service-id"
            >
              Official Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-ink-navy/60 text-sm">
                  badge
                </span>
              </div>
              <input
                id="service-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="NCC-XXXX-XXXX / admin@ncc.gov.in"
                className="w-full h-11 pl-10 pr-4 bg-white/90 border border-hairline rounded-lg focus:ring-1 focus:ring-brass focus:border-brass transition-all text-data-md text-ink-navy focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input with Eye Visibility Toggle Button */}
          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label
                className="block font-label-caps text-label-caps text-ink-navy uppercase"
                htmlFor="password"
              >
                Security Passcode
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-ink-navy/60 text-sm">
                  lock
                </span>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-11 bg-white/90 border border-hairline rounded-lg focus:ring-1 focus:ring-brass focus:border-brass transition-all text-data-md text-ink-navy focus:outline-none"
              />
              {/* EYE BUTTON FOR VIEW PASSWORD */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-navy/60 hover:text-ink-navy cursor-pointer transition-colors"
                title={showPassword ? "Hide Passcode" : "Show Passcode"}
              >
                <span className="material-symbols-outlined text-base">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brass text-ink-navy rounded-lg font-label-caps text-label-caps font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">
                  sync
                </span>
                <span>VERIFYING...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-base">
                  login
                </span>
              </>
            )}
          </button>

          {/* Institutional Footnote */}
          <div className="pt-4 border-t border-hairline">
            <p className="font-body-sm text-body-sm text-ink-navy/70 text-center italic">
              &quot;Ekta Aur Anushasan&quot; <br /> (Unity and Discipline)
            </p>
          </div>
        </form>

        {/* Requisition Stamp Flourish */}
        <div className="requisition-stamp">
          <svg height="120" viewBox="0 0 100 100" width="120">
            <circle
              className="text-brass"
              cx="50"
              cy="50"
              fill="none"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
            ></circle>
            <path d="M 20,50 A 30,30 0 1,1 80,50" fill="none" id="curve"></path>
            <text
              className="text-[8px] font-bold uppercase fill-brass"
              fontFamily="IBM Plex Sans"
            >
              <textPath startOffset="50%" textAnchor="middle" href="#curve">
                AUTHORIZED ENTRY • NCC COMMAND
              </textPath>
            </text>
            <text
              className="text-[12px] font-bold fill-brass"
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
              x="50"
              y="55"
            >
              VERIFIED
            </text>
          </svg>
        </div>
      </main>

      {/* Footer Information */}
      <footer className="mt-stack-md text-center space-y-2 relative z-10 drop-shadow-md">
        <p className="font-label-caps text-label-caps text-paper uppercase tracking-widest opacity-90">
          Supply Division - NCC Command
        </p>
        <div className="flex items-center justify-center gap-4 text-paper opacity-70 text-xs">
          <span className="font-body-sm text-body-sm">v4.2.1-SEC</span>
          <span className="h-1 w-1 rounded-full bg-paper"></span>
          <span className="font-body-sm text-body-sm">Privacy Directive</span>
          <span className="font-body-sm text-body-sm">System Status: Nominal</span>
        </div>
      </footer>
    </div>
  );
}
