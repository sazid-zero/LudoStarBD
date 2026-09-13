"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import {
  User as UserIcon,
  Phone,
  Wallet,
  Trophy,
  Share2,
  BookOpen,
  LogOut,
  Shield,
  MessageCircle,
  Send,
  Facebook,
  Mail,
  ChevronRight,
  Swords,
  Code,
  Settings,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, loading } = useUser();
  const { showToast } = useToast();

  const [stats, setStats] = useState<{ played: number; won: number; winnings: number }>({
    played: 0,
    won: 0,
    winnings: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error loading user stats:", err);
      }
    }
    loadStats();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("সফলভাবে লগআউট হয়েছে", "info");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      window.location.href = "/login";
    }
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "01342968557";
  const telegramLink = process.env.NEXT_PUBLIC_TELEGRAM_LINK || "https://t.me/mr_rolex42";
  const facebookLink = process.env.NEXT_PUBLIC_FACEBOOK_LINK || "https://www.facebook.com/share/1Eco5f183E/";
  const helplineMobile = process.env.NEXT_PUBLIC_SUPPORT_MOBILE || "01321063123";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "ya8913317@gmail.com";

  const isAdmin = user?.role === "ADMIN";

  return (
    <AppShell title={isAdmin ? "Admin Profile" : "Me"}>
      <div className="min-h-screen bg-[#0e0826] pb-24 text-white">
        <div className="p-3.5 space-y-4">
          {/* Profile Hero Card with Glow Halo */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#1c1242] via-[#160f38] to-[#120b2e] border border-purple-500/30 shadow-[0_0_24px_rgba(139,92,246,0.15)] flex flex-col items-center text-center">
            {/* Centered Glowing Avatar */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-purple-400 p-0.5 shadow-[0_0_24px_rgba(168,85,247,0.6)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#1b1242] flex items-center justify-center text-amber-300 font-black text-2xl border-2 border-purple-400/80">
                  {loading ? "..." : (user?.firstName?.slice(0, 1).toUpperCase() || (isAdmin ? "A" : "U"))}
                </div>
              </div>
              {isAdmin && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black border border-rose-400 shadow">
                  ADMIN
                </span>
              )}
            </div>

            <h2 className="text-lg font-black text-white tracking-tight">
              {loading ? "লোড হচ্ছে..." : user ? `${user.firstName} ${user.lastName}`.trim() : "অতিথি"}
            </h2>
            <p className="text-xs text-purple-300/80 font-mono mt-0.5">
              Phone: {user?.phone || (loading ? "..." : "লগইন করা নেই")}
            </p>

            {/* Balances 2-Column Row */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-4 pt-3 border-t border-purple-500/20">
              <div className="p-2.5 rounded-2xl bg-[#1a113d]/80 border border-purple-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5">
                  Gaming Balance
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                  ৳ {(user?.mainBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-[#1a113d]/80 border border-purple-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5">
                  Winning Balance
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                  ৳ {(user?.winBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Gameplay Stats 3-Column Row */}
            <div className="grid grid-cols-3 gap-2 w-full mt-2.5 pt-2.5 border-t border-purple-500/15">
              <div className="text-center">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                  Played
                </span>
                <span className="text-sm font-black text-white font-mono mt-0.5 block">
                  {stats.played}
                </span>
              </div>

              <div className="text-center border-x border-purple-500/20">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                  Won
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                  {stats.won}
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                  Winnings
                </span>
                <span className="text-sm font-black text-amber-300 font-mono mt-0.5 block">
                  ৳ {stats.winnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Fast Actions Hub (Visible only to Admin) */}
          {isAdmin && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#171038] to-rose-950/20 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>এডমিন কন্ট্রোল সেন্টার</span>
                </span>
                <Link href="/admin" className="text-[11px] text-purple-300 hover:underline font-bold">
                  সম্পূর্ণ প্যানেল ›
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/admin?tab=MATCHES"
                  className="p-2.5 rounded-xl bg-[#1c1245] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <span className="font-bold text-white text-xs">ম্যাচ ও রুম কোড</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                </Link>
                <Link
                  href="/admin?tab=DEPOSITS"
                  className="p-2.5 rounded-xl bg-[#1c1245] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <span className="font-bold text-white text-xs">ডিপোজিট TrxID</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                </Link>
                <Link
                  href="/admin?tab=WITHDRAWALS"
                  className="p-2.5 rounded-xl bg-[#1c1245] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <span className="font-bold text-white text-xs">উইথড্র ও পেআউট</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                </Link>
                <Link
                  href="/admin?tab=USERS"
                  className="p-2.5 rounded-xl bg-[#1c1245] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <span className="font-bold text-white text-xs">ইউজার ডাটাবেজ</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                </Link>
              </div>
            </div>
          )}

          {/* Reference Menu List Style */}
          <div className="rounded-3xl bg-[#171038] border border-purple-500/20 divide-y divide-purple-500/10 overflow-hidden text-xs">
            {/* My Profile Setting */}
            <Link
              href="/rules"
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-xs">My Profile Setting</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </Link>

            {/* My Wallet */}
            <Link
              href="/wallet"
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-xs">My Wallet</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </Link>

            {/* Top Players */}
            <Link
              href="/leaderboard"
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-xs">Top Players</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </Link>

            {/* Refer and Earn */}
            <Link
              href="/dashboard"
              onClick={() => {
                if (user?.referCode) {
                  navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referCode}`);
                  showToast(`রেফারেল লিংক কপি হয়েছে: ${user.referCode}`, "success");
                }
              }}
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Refer and Earn</span>
                  {user?.referCode && (
                    <span className="text-[10px] text-amber-300 font-mono">Code: {user.referCode}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </Link>

            {/* Admin Support */}
            <a
              href={`https://wa.me/88${whatsappNumber}?text=Hello%20Support`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Admin Support</span>
                  <span className="text-[10px] text-slate-400 font-mono">{whatsappNumber}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </a>

            {/* Developer Profile / Rules */}
            <Link
              href="/rules"
              className="flex items-center justify-between p-3.5 hover:bg-purple-900/20 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Code className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-xs">Developer Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400/60" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3.5 hover:bg-rose-950/30 text-rose-400 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-bold text-rose-400 text-xs">Logout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
