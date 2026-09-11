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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 relative transition-colors ${
                isActive ? "text-[#0070F3]" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#0070F3]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
