"use client";

import { Fira_Code, Montserrat, Raleway } from "next/font/google";
import Image from "next/image";
import { AlertTriangle, TrendingUp, Users2, Ban } from "lucide-react";
import newsCollage from "../../public/news.jpg";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const problems = [
  {
    icon: TrendingUp,
    title: "Skyrocketing Prices",
    stat: "26x",
    description:
      "Increase in resale prices, making tickets unaffordable for real fans",
  },
  {
    icon: Users2,
    title: "Genuine Fans Excluded",
    stat: "70%",
    description: "Of tickets end up with scalpers instead of true fans",
  },
  {
    icon: AlertTriangle,
    title: "Legal Grey Areas",
    stat: "₹2L+",
    description:
      "Tickets being resold at astronomical prices due to lack of regulation",
  },
  {
    icon: Ban,
    title: "Bot Manipulation",
    stat: "Seconds",
    description: "Tickets vanish instantly due to automated buying systems",
  },
];

export function ProblemsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-left gap-2 mb-8 sm:mb-12">
          <span
            className={`${firaCode.className} px-4 py-1 font-normal text-sm rounded-full bg-red-500/20 text-red-200 w-fit`}
          >
            Industry Crisis
          </span>
          <h2
            className={`${montserrat.className} text-3xl sm:text-4xl text-[#FFFFFFB2] font-medium max-w-2xl`}
          >
            <span className="text-white">The Ticket Industry is Broken</span> -
            And Fans Are Paying the Price
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Problem cards */}
          <div className="space-y-6">
            <p className={`${raleway.className} text-white/70 text-lg mb-8`}>
              The current ticketing system is failing fans worldwide. Scalpers
              and bots are creating artificial scarcity, leading to
              unprecedented price hikes and frustrated fans.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/30 transition-all group h-full"
                >
                  <div className="flex items-center gap-4 mb-[21px]">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-all">
                      <problem.icon className="w-5 h-5" />
                    </div>
                    <h3
                      className={`${montserrat.className} text-lg text-white font-medium`}
                    >
                      {problem.title}
                    </h3>
                  </div>
                  <div
                    className={`${firaCode.className} text-2xl text-red-400 mb-2`}
                  >
                    {problem.stat}
                  </div>
                  <p className={`${raleway.className} text-white/70 text-sm`}>
                    {problem.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - News collage */}
          <div className="relative h-full flex items-end">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-cyan-500/20 rounded-2xl blur-2xl translate-y-11" />
            <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full">
              <Image
                src={newsCollage}
                alt="News articles about ticket scalping"
                className="rounded-lg w-full h-auto"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/60 rounded-xl" />
              <p
                className={`${firaCode.className} text-xs text-white/50 mt-2 text-center`}
              >
                Recent headlines highlighting the ticketing crisis
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
