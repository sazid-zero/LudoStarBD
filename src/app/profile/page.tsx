"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import {
  User as UserIcon,
  Phone,
  Wallet,
  Gift,
  BookOpen,
  LogOut,
  Shield,
  MessageCircle,
  Send,
  Facebook,
  Mail,
  ChevronRight,
  Swords,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, loading } = useUser();
  const { showToast } = useToast();

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
    <AppShell title={isAdmin ? "এডমিন প্রোফাইল" : "আমার প্রোফাইল"}>
      <div className="p-3.5 space-y-4">
        {/* Profile Card */}
        <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3.5 ${
          isAdmin
            ? "bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-500/40 shadow-rose-500/10"
            : "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border-slate-800"
        }`}>
          <div className={`w-14 h-14 rounded-full font-black text-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
            isAdmin
              ? "bg-gradient-to-br from-rose-500 via-amber-500 to-amber-600 text-slate-950 ring-2 ring-rose-400/50"
              : "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950"
          }`}>
            {loading ? "..." : (user?.firstName?.slice(0, 1) || (isAdmin ? "A" : "U"))}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-white truncate">
              {loading ? "লোড হচ্ছে..." : user ? `${user.firstName} ${user.lastName}`.trim() : "অতিথি"}
            </h2>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-0.5">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>{user?.phone || (loading ? "লোড হচ্ছে..." : "লগইন করা নেই")}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {isAdmin ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-sm">
                  <Shield className="w-3 h-3 text-rose-400" />
                  <span>সিস্টেম এডমিনিস্ট্রেটর</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ভেরিফাইড প্লেয়ার
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              খেলার ব্যালেন্স
            </span>
            <span className="text-lg font-black text-white font-mono">
              ৳ {(user?.mainBalance || 0).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              উইনিং ব্যালেন্স
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ৳ {(user?.winBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Admin Fast Actions Hub (Prominently displayed for Admin Profile) */}
        {isAdmin && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>এডমিন কন্ট্রোল সেন্টার</span>
              </span>
              <Link href="/admin" className="text-[11px] text-cyan-400 hover:underline font-bold">
                সম্পূর্ণ প্যানেল ›
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin?tab=MATCHES"
                className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-850 transition-all flex flex-col gap-1 shadow"
              >
                <div className="flex items-center justify-between">
                  <Swords className="w-4 h-4 text-amber-400" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="font-bold text-white text-xs mt-1">ম্যাচ ও রুম কোড</span>
                <span className="text-[10px] text-slate-400">রুম আইডি ও উইনার যাচাই</span>
              </Link>

              <Link
                href="/admin?tab=DEPOSITS"
                className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-850 transition-all flex flex-col gap-1 shadow"
              >
                <div className="flex items-center justify-between">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="font-bold text-white text-xs mt-1">ডিপোজিট TrxID</span>
                <span className="text-[10px] text-slate-400">পেমেন্ট চেক ও অনুমোদন</span>
              </Link>

              <Link
                href="/admin?tab=WITHDRAWALS"
                className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-850 transition-all flex flex-col gap-1 shadow"
              >
                <div className="flex items-center justify-between">
                  <Gift className="w-4 h-4 text-cyan-400" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="font-bold text-white text-xs mt-1">উইথড্র ও পেআউট</span>
                <span className="text-[10px] text-slate-400">খেলোয়াড়দের টাকা পাঠান</span>
              </Link>

              <Link
                href="/admin?tab=USERS"
                className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-400 hover:bg-slate-850 transition-all flex flex-col gap-1 shadow"
              >
                <div className="flex items-center justify-between">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="font-bold text-white text-xs mt-1">ইউজার ডাটাবেজ</span>
                <span className="text-[10px] text-slate-400">ব্যালেন্স ও প্রোফাইল</span>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden text-xs">
          <Link
            href="/wallet"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">লেনদেনের হিস্ট্রি ও ওয়ালেট</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/play"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Swords className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">লাইভ লুডো কনসোল</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/rules"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-white">খেলার নিয়ম ও ভিডিও টিউটোরিয়াল</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <a
            href={`https://wa.me/88${whatsappNumber}?text=Hello%20LudoStarBD%20Support`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <div>
                <span className="font-semibold text-white block">হোয়াটসঅ্যাপ সাপোর্ট</span>
                <span className="text-[10px] text-slate-400 font-mono">{whatsappNumber}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </a>

          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4 text-[#229ED9]" />
              <div>
                <span className="font-semibold text-white block">টেলিগ্রাম চ্যানেল ও সাপোর্ট</span>
                <span className="text-[10px] text-cyan-400 font-mono">@mr_rolex42</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </a>

          <a
            href={facebookLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              <span className="font-semibold text-white">ফেসবুক পেজ</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </a>

          <a
            href={`tel:${helplineMobile}`}
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-white block">মোবাইল হেল্পলাইন</span>
                <span className="text-[10px] text-slate-400 font-mono">{helplineMobile}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </a>

          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center justify-between p-3.5 hover:bg-slate-850 text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-rose-400" />
              <div>
                <span className="font-semibold text-white block">অফিশিয়াল ইমেইল</span>
                <span className="text-[10px] text-slate-400">{supportEmail}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </a>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold text-xs transition-all active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট করুন</span>
        </button>
      </div>
    </AppShell>
  );
}
