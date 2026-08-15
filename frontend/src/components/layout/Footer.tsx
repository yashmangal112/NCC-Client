"use client";

import { FiZap, FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FOOTER_LINKS, SOCIAL_LINKS, CONTACT_INFO, APP_STORES } from "@/data";
import logo from "../../../public/logo.png";
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="policy" className="border-t border-white/5 bg-black/60 backdrop-blur-xl pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ">
                {/* <FiZap className="text-white text-sm" /> */}
                <Image src={logo} alt="GoBeyondTickets Logo" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-violet-400 via-blue-400 to-violet-300 bg-clip-text text-transparent">
                GoBeyondTickets
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Changing the way blockchain interacts with real world
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => {
                  const fileName = link
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, "-"); // replace ALL spaces

                  return (
                    <li key={link}>
                      <a
                        href={`/${fileName}`}
                        className="text-gray-400 text-sm hover:text-white transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* App Download Strip */}
        {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-y border-white/5 mb-8">
          <div>
            <p className="text-white font-bold mb-1">Download the App</p>
            <p className="text-gray-400 text-sm">
              Faster booking, exclusive app-only deals.
            </p>
          </div>
          <div className="flex gap-3">
            {APP_STORES.map((store) => (
              <button
                key={store}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <FiZap size={12} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-gray-400 text-[10px] leading-none mb-0.5">
                    Download on
                  </p>
                  <p className="text-white text-sm font-semibold leading-none">
                    {store}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div> */}

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} GoBeyondTickets Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <FiPhone size={11} />
              {CONTACT_INFO.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <FiMail size={11} />
              {CONTACT_INFO.email}
            </span>
            <span className="flex items-center gap-1.5">
              <FiMapPin size={11} />
              {CONTACT_INFO.location}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
