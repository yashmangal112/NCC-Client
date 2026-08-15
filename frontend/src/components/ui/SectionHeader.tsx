"use client";

import { FiTrendingUp, FiArrowRight } from "react-icons/fi";
import type { SectionHeaderProps } from "@/types";

export default function SectionHeader({
  tag,
  title,
  subtitle,
  cta,
  onCtaClick,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        {tag && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-violet-400 mb-3">
            <FiTrendingUp size={10} />
            {tag}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-gray-400 text-sm">{subtitle}</p>
        )}
      </div>

      {cta && (
        <button
          onClick={onCtaClick}
          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors shrink-0 group"
        >
          {cta}
          <FiArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      )}
    </div>
  );
}
