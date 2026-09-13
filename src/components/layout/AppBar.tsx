"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Wallet, MessageCircle, Bell, CheckCheck, X, Trophy, AlertTriangle, Info, Sparkles } from "lucide-react";
import LanguageToggle from "../common/LanguageToggle";

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  userBalance?: number;
}

export default function AppBar({
  title = "LudoEarn",
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
      <header className="sticky top-0 z-40 w-full bg-[#0e0826]/95 backdrop-blur-md border-b border-purple-500/20 shadow-[0_4px_24px_rgba(10,5,30,0.8)]">
        <div className="flex items-center justify-between h-14 px-2.5 sm:px-3 max-w-md mx-auto gap-2">
          {/* Left Side */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {showBack ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="w-8 h-8 rounded-full bg-[#1b1242] border border-purple-500/30 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate max-w-[150px] sm:max-w-[200px]">
                  {title}
                </h1>
              </div>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2 select-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-[#160f38] border border-purple-500/40 shadow-[0_0_14px_rgba(139,92,246,0.3)] flex items-center justify-center p-0.5 flex-shrink-0">
                  <Image src="/logo.png" alt="LudoEarn" width={38} height={38} className="object-contain w-full h-full rounded-lg" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm sm:text-base font-black tracking-tight leading-none whitespace-nowrap">
                    <span className="text-white">LUDO</span>{" "}
                    <span className="text-purple-400">STAR</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-purple-300/70 tracking-wider font-semibold mt-0.5 hidden xs:block whitespace-nowrap">
                    Play • Compete • Win
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Language Switcher */}
            <LanguageToggle />

            {/* In-App Notification Bell */}
            <button
              onClick={() => {
                setShowNotifications(true);
                fetchNotifications();
              }}
              className="relative w-8 h-8 text-amber-300 bg-[#1b1242] border border-purple-500/30 rounded-full hover:bg-purple-900/40 active:scale-95 transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
              title="নোটিফিকেশন"
            >
              <Bell className="w-4 h-4 fill-amber-400/80 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Reference-Styled Wallet Balance Pill */}
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1242] border border-purple-500/40 text-amber-300 font-black text-xs sm:text-sm font-mono shadow-[0_0_14px_rgba(139,92,246,0.2)] hover:border-purple-400 active:scale-95 transition-all flex-shrink-0"
              title="ওয়ালেট দেখুন"
            >
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">৳</span>
              <span>{(userBalance !== undefined ? userBalance : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
