import React from "react";
import { Ticket } from "lucide-react";
import logo from "../../public/logo.png";
import Image from "next/image";

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="relative">
        {/* Glowing background effect */}
        <div className="absolute inset-0 animate-pulse bg-cyan-500/20 blur-xl rounded-full" />

        {/* Rotating glow effect */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="h-full w-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 blur-md" />
        </div>

        {/* Ticket icon with animation */}
        <div className="relative animate-bounce-gentle">
          <Image
            src={logo}
            className="w-20 h-20 text-cyan-500 animate-pulse"
            alt="logo"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
