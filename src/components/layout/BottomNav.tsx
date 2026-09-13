"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Wallet, Trophy, User } from "lucide-react";
import { useLanguage } from "../common/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const navItems = [
    { label: lang === "en" ? "Home" : "হোম", href: "/dashboard", icon: Home },
    { label: lang === "en" ? "Matches" : "ম্যাচ", href: "/matches", icon: Swords },
    { label: lang === "en" ? "Wallet" : "ওয়ালেট", href: "/wallet", icon: Wallet },
    { label: lang === "en" ? "Ranks" : "লিডারবোর্ড", href: "/leaderboard", icon: Trophy },
    { label: lang === "en" ? "Profile" : "প্রোফাইল", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0826]/95 backdrop-blur-md border-t border-purple-500/20 shadow-[0_-4px_20px_rgba(10,5,30,0.8)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 relative transition-colors ${
                isActive ? "text-purple-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
              <div className={`transition-all duration-200 ${isActive ? "scale-110 -translate-y-0.5" : ""}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" : "text-slate-400"}`} />
              </div>
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? "text-purple-300 font-extrabold" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
