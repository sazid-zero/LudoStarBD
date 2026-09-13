"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Wallet, MessageCircle, Bell, CheckCheck, X, Trophy, AlertTriangle, Info, Sparkles, Coins } from "lucide-react";
import LanguageToggle from "../common/LanguageToggle";

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  userBalance?: number;
}

export default function AppBar({
  title = "LudoStar BD",
  showBack = false,
  userBalance,
}: AppBarProps) {
  const router = useRouter();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "01342968557";

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll silently every 12 seconds for real-time room codes & payouts
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ", notificationId: notif.id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      setShowNotifications(false);
      router.push(notif.link);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#060d1e]/95 backdrop-blur-md border-b border-sky-500/20 shadow-[0_4px_20px_rgba(2,6,23,0.6)]">
        <div className="flex items-center justify-between h-14 px-2.5 sm:px-3 max-w-md mx-auto gap-1">
          {/* Left Side (Brand - strictly protected from shrinking/overlapping) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {showBack ? (
              <button
                onClick={() => router.back()}
                className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 select-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-black/40 border border-sky-400/40 shadow-[0_0_12px_rgba(0,173,181,0.3)] flex items-center justify-center p-0.5 flex-shrink-0">
                  <Image src="/newlogo.png" alt="LudoStar BD" width={38} height={38} className="object-contain w-full h-full rounded-lg" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm sm:text-base font-black tracking-tight leading-none whitespace-nowrap">
                    <span className="text-white">LudoStar</span>
                    <span className="text-amber-400"> BD</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 tracking-wider font-semibold mt-0.5 hidden xs:block whitespace-nowrap">
                    Play • Compete • Win
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Right Side (Actions - neatly spaced and protected) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto">
            {/* Language Switcher */}
            <LanguageToggle />

            {/* In-App Notification Bell */}
            <button
              onClick={() => {
                setShowNotifications(true);
                fetchNotifications();
              }}
              className="relative w-7 h-7 sm:w-8 sm:h-8 text-white/90 bg-slate-800/80 border border-slate-700/80 rounded-full hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
              title="নোটিফিকেশন"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Quick Browser Play Button (hidden on narrow screens to ensure zero crowd) */}
            <Link
              href="/play"
              className="w-7 h-7 sm:w-8 sm:h-8 text-white/90 bg-slate-800/80 border border-slate-700/80 rounded-full hover:bg-slate-700 active:scale-95 transition-all hidden xs:flex items-center justify-center text-xs shadow-sm flex-shrink-0"
              title="Play in Browser"
            >
              🎲
            </Link>

            {/* WhatsApp Support */}
            <a
              href={`https://wa.me/88${whatsappNumber}?text=Hello%20LudoStarBD%20Support`}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 sm:w-8 sm:h-8 text-white/90 bg-slate-800/80 border border-slate-700/80 rounded-full hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
              title="WhatsApp সাপোর্ট"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </a>

            {/* Wallet Balance Chip in Coins */}
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-white font-extrabold text-[11px] sm:text-xs font-mono shadow-sm hover:border-amber-400 active:scale-95 transition-all flex-shrink-0"
              title="কয়েন ওয়ালেট দেখুন"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold">{(userBalance !== undefined ? userBalance : 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span className="text-[9px] text-amber-400 font-sans font-extrabold uppercase tracking-wide">Coins</span>
              <span className="text-slate-400 text-xs font-normal">›</span>
            </Link>
          </div>
        </div>

        {/* Signature 4-Color Token Rail */}
        <div className="token-rail" />
      </header>

      {/* Notifications Drawer / Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-14">
          <div className="relative w-full max-w-md bg-[#0d1527] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp">
            {/* Header */}
            <div className="p-3.5 border-b border-[#1a2333] flex items-center justify-between bg-[#080d1a]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white">বিজ্ঞপ্তি ও নোটিফিকেশন</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30">
                    {unreadCount} নতুন
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    title="সবগুলো পঠিত মার্ক করুন"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>সব পঠিত</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-[#1a2333]/50">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
                  <p className="text-xs">বর্তমানে কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon =
                    n.type === "SUCCESS"
                      ? Trophy
                      : n.type === "ALERT"
                      ? AlertTriangle
                      : n.type === "PROMO"
                      ? Sparkles
                      : n.type === "ANNOUNCEMENT"
                      ? Bell
                      : Info;
                  const iconColor =
                    n.type === "SUCCESS"
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                      : n.type === "ALERT"
                      ? "text-red-400 bg-red-500/10 border-red-500/30"
                      : n.type === "PROMO"
                      ? "text-purple-400 bg-purple-500/10 border-purple-500/30"
                      : n.type === "ANNOUNCEMENT"
                      ? "text-cyan-300 bg-cyan-500/20 border-cyan-400/40"
                      : "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`pt-2.5 first:pt-0 flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                        !n.isRead
                          ? "bg-[#111c36] border border-cyan-500/30 shadow-sm"
                          : "bg-transparent hover:bg-[#0a0f1d]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconColor}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              !n.isRead ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-slate-500 flex-shrink-0 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString("bn-BD", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          {n.message}
                        </p>
                        {n.link && (
                          <span className="text-[10px] text-cyan-400 font-bold hover:underline inline-block mt-1">
                            বিস্তারিত দেখুন ›
                          </span>
                        )}
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[#080d1a] border-t border-[#1a2333] text-center">
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
