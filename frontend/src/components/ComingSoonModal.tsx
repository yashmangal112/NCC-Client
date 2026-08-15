"use client";

import { Sparkles, X } from 'lucide-react';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Purple Glow Effect */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-purple-500/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-cyan-500/20 blur-[100px] rounded-full" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-[#0497AA]" />
            <span className={`${montserrat.className} text-[#0497AA] font-medium`}>
              Coming Soon!
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-4 mb-8">
            <h3 className={`${montserrat.className} text-2xl sm:text-3xl font-semibold text-white`}>
              Get Ready for the Future of Events
            </h3>
            <p className="text-white/80 leading-relaxed">
              Be prepared to attend events in the best way possible. Until then, join our vibrant community and stay updated on our progress!
            </p>
          </div>

          {/* Button */}
          <a
            href="https://whatsapp.com/channel/0029VayNajh5fM5VAT6hk40f"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full"
          >
            <button className="w-full bg-[#0497AA] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-cyan-500 transition-all">
              Join the community
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
