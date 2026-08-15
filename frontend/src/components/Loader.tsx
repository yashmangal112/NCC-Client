"use client";

import { motion } from "framer-motion";
import { JSX } from "react";

type LoaderVariant = "default" | "overlay" | "dots" | "skeleton";

interface LoaderProps {
  variant?: LoaderVariant;
  count?: number;
}

export default function Loader({
  variant = "default",
  count = 6,
}: LoaderProps) {
  if (variant === "overlay") return <OverlayLoader />;
  if (variant === "dots") return <DotLoader />;
  if (variant === "skeleton") return <SkeletonGrid count={count} />;
  return <ContentAreaLoader />;
}

// ── 1. Content-area loader ─────────────────────────────
function ContentAreaLoader(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full flex flex-col items-center justify-center gap-5"
      style={{ minHeight: "calc(100vh - 140px)" }}
    >
      <Spinner />
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-[3px] animate-pulse">
        Loading...
      </p>
    </motion.div>
  );
}

// ── 2. Overlay loader ──────────────────────────────────
function OverlayLoader(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 backdrop-blur-md bg-black/60"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center gap-5"
      >
        <Spinner />
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-[3px] animate-pulse">
          Loading...
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Spinner ────────────────────────────────────────────
function Spinner(): JSX.Element {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full blur-md opacity-40 bg-gradient-to-tr from-[#8B5CF6] via-[#6366F1] to-[#3B82F6]" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-800" />
      <div
        className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
        style={{
          borderTopColor: "#8B5CF6",
          borderRightColor: "#3B82F6",
          animationDuration: "0.9s",
        }}
      />
    </div>
  );
}

// ── Dot loader ─────────────────────────────────────────
function DotLoader(): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ── Skeleton grid ──────────────────────────────────────
function SkeletonGrid({ count }: { count: number }): JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 my-6 px-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[220px] rounded-2xl bg-[#111118] border border-gray-800 animate-pulse"
        />
      ))}
    </div>
  );
}