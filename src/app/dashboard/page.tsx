"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import { useLanguage } from "@/components/common/LanguageContext";
import MatchCard from "@/components/matches/MatchCard";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";
import CreateMatchModal from "@/components/matches/CreateMatchModal";
import NoticeModal from "@/components/common/NoticeModal";
import { Match } from "@/lib/types";
import { getYoutubeEmbedUrl, getYoutubeWatchUrl } from "@/lib/youtube";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  PlusCircle,
  Swords,
  Flame,
  ChevronRight,
  Sparkles,
  Shield,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function DashboardPage() {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const { lang, t } = useLanguage();

  const [matches, setMatches] = useState<Match[]>([]);
  const [notice, setNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Video guide state
  const [dashboardVideoUrl, setDashboardVideoUrl] = useState("https://www.youtube.com/watch?v=Y7VWtTgX0Rc");
  const [matchesVideoUrl, setMatchesVideoUrl] = useState("https://www.youtube.com/watch?v=Y7VWtTgX0Rc");
  const [showVideoPlayer, setShowVideoPlayer] = useState(true);

  // Modals
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  // Active banner index
  const [bannerIdx, setBannerIdx] = useState(0);

  const banners = [
    {
      title: lang === "en" ? "Mega Ludo Tournament" : "মেগা লুডো টুর্নামেন্ট",
      subtitle: lang === "en" ? "৳10,000 Prize Pool • Daily at 9:00 PM" : "৳১০,০০০ প্রাইজপুল • প্রতিদিন রাত ৯টায়",
      badge: lang === "en" ? "Special Event" : "স্পেশাল ইভেন্ট",
      image: "/uploads/proofs/banner1.png",
      bg: "from-blue-950/80 via-[#0a1532] to-[#050b1a]",
    },
    {
      title: lang === "en" ? "1 vs 1 Fast Match" : "১ বনাম ১ ফাস্ট ম্যাচ",
      subtitle: lang === "en" ? "10s matchmaking, 5 mins game" : "১০ সেকেন্ডে প্রতিপক্ষ, ৫ মিনিটে খেলা শেষ",
      badge: lang === "en" ? "Popular" : "জনপ্রিয়",
      image: "/uploads/proofs/banner2.png",
      bg: "from-teal-950/80 via-[#0a1532] to-[#050b1a]",
    },
    {
      title: lang === "en" ? "24/7 Fast Cashout" : "২৪/৭ ফাস্ট ক্যাশআউট",
      subtitle: lang === "en" ? "Instant bKash, Nagad & Rocket withdrawals" : "বিকাশ, নগদ ও রকেটে দ্রুততম সার্ভিস",
      badge: lang === "en" ? "Verified" : "ভেরিফাইড",
      image: "/uploads/proofs/banner1.png",
      bg: "from-sky-950/80 via-[#0a1532] to-[#050b1a]",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const fetchMatches = async (silent = false) => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      const data = await res.json();
      setMatches(data.matches || []);
      if (data.notice) setNotice(data.notice);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Fetch video settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d?.settings?.video_dashboard) {
          setDashboardVideoUrl(d.settings.video_dashboard);
        }
        if (d?.settings?.video_matches) {
          setMatchesVideoUrl(d.settings.video_matches);
        }
      })
      .catch((err) => console.error("Error fetching dashboard video:", err));

    // Real-time polling every 4 seconds
    const interval = setInterval(() => fetchMatches(true), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (matchId: string) => {
    if (!user) {
      showToast(lang === "en" ? "Please login to join matches" : "ম্যাচে জয়েন করতে আগে লগইন করুন", "error");
      return;
    }

    setJoiningId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (lang === "en" ? "Failed to join match" : "ম্যাচে জয়েন করতে সমস্যা হয়েছে"));
      }

      showToast(data.message || (lang === "en" ? "Successfully joined match!" : "সফলভাবে ম্যাচে যুক্ত হয়েছেন!"), "success");
      await refreshUser();
      await fetchMatches();
    } catch (err: any) {
      showToast(err.message || (lang === "en" ? "An error occurred" : "সমস্যা হয়েছে"), "error");
    } finally {
      setJoiningId(null);
    }
  };

  const totalBalance = (user?.mainBalance || 0) + (user?.winBalance || 0);

  return (
    <AppShell title="LUDO STAR">
      {/* Announcement Ticker (Clickable to open full Notice) */}
      <div
        onClick={() => setNoticeModalOpen(true)}
        className="ticker-wrap px-2.5 sm:px-3 text-xs cursor-pointer hover:bg-[#140b38] transition-colors border-b border-purple-500/20 flex items-center overflow-hidden"
        title={lang === "en" ? "Click to view full notice" : "সম্পূর্ণ নোটিশ দেখতে ক্লিক করুন"}
      >
        {/* Pinned Notice Badge with solid background */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1e1347] border border-purple-400/50 text-purple-300 font-bold text-[11px] mr-2 flex-shrink-0 z-20 shadow-sm select-none">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse drop-shadow-[0_0_6px_#F59E0B]" />
          <span>{t("ticker.label")}</span>
        </div>

        {/* Isolated Viewport for Scrolling Text */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div className="ticker-move text-slate-300 font-medium text-xs whitespace-nowrap">
            {notice || t("ticker.default")}
          </div>
          {/* Subtle Fade Edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#0e0826] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#0e0826] to-transparent z-10" />
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Admin Bar (Visible only to Admin) */}
        {user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 via-[#171038] to-rose-950/40 border border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{lang === "en" ? "Admin Management Panel" : "এডমিন ম্যানেজমেন্ট প্যানেল"}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">ADMIN</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{lang === "en" ? "Manage deposits, withdrawals, matches & disputes" : "ডিপোজিট, উইথড্র, ম্যাচ ও বিরোধ পরিচালনা করুন"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
          </Link>
        )}

        {/* Deposit & Withdraw Video Guide Card */}
        <div className="rounded-2xl bg-[#171038] border border-purple-500/25 overflow-hidden shadow-lg shadow-purple-950/40">
          <div className="p-3 sm:p-3.5 flex items-center justify-between border-b border-purple-500/15 bg-[#1b1242]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Play className="w-4 h-4 fill-purple-400 ml-0.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">
                    {lang === "en" ? "How to Deposit & Withdraw Money" : "কীভাবে ডিপোজিট ও টাকা তুলবেন"}
                  </h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    ভিডিও গাইড
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {lang === "en" ? "Watch this quick tutorial to learn deposit & cashout rules" : "সহজেই টাকা যোগ ও উইথড্র করার সম্পূর্ণ নিয়ম ভিডিওতে দেখুন"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={getYoutubeWatchUrl(dashboardVideoUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all active:scale-95"
                title="YouTube-এ ওপেন করুন"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">YouTube</span>
              </a>
              <button
                onClick={() => setShowVideoPlayer(!showVideoPlayer)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-purple-900/40 transition-all"
                aria-label="ভিডিও মিনিমাইজ করুন"
                title={showVideoPlayer ? "ভিডিও মিনিমাইজ করুন" : "ভিডিও ওপেন করুন"}
              >
                {showVideoPlayer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showVideoPlayer && (
            <div className="p-3 bg-black/40">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-purple-500/30 shadow-2xl">
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(dashboardVideoUrl)}
                  title="How to Deposit & Withdraw on LudoEarn"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Cards Grid: ডিপোজিট, উইথড্র, নিয়মাবলী */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Deposit */}
          <button
            onClick={() => setDepositOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#171038] text-white border border-purple-500/20 shadow-[0_4px_16px_rgba(10,5,30,0.4)] hover:border-purple-400/40 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">
              {lang === "en" ? "Deposit" : "ডিপোজিট"}
            </span>
          </button>

          {/* Withdraw */}
          <button
            onClick={() => setWithdrawOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#171038] text-white border border-purple-500/20 shadow-[0_4px_16px_rgba(10,5,30,0.4)] hover:border-purple-400/40 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">
              {lang === "en" ? "Withdraw" : "উইথড্র"}
            </span>
          </button>

          {/* Rules */}
          <Link
            href="/rules"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#171038] text-white border border-purple-500/20 shadow-[0_4px_16px_rgba(10,5,30,0.4)] hover:border-purple-400/40 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white truncate">
              {lang === "en" ? "Rules" : "নিয়মাবলী"}
            </span>
          </Link>
        </div>

        {/* Banner 1: নিজের কাস্টম ম্যাচ খুলুন */}
        <div className="p-3.5 rounded-2xl bg-[#171038] text-white border border-purple-500/20 shadow-[0_4px_16px_rgba(10,5,30,0.5)] flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image
                src="/wallet_3d.png"
                alt="Wallet"
                fill
                className="object-contain drop-shadow"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {lang === "en" ? "Create Custom Match" : "নিজের কাস্টম ম্যাচ খুলুন"}
              </h3>
              <p className="text-[11px] text-purple-300/80 mt-0.5 leading-snug">
                {lang === "en" ? "Join any premium match & win big rewards" : "যেকোনো প্রিমিয়াম ম্যাচ অংশ নিয়ে জিতুন আকর্ষণীয় পুরস্কার"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateMatchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex-shrink-0 shadow-md shadow-purple-900/40 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Create" : "ম্যাচ বানান"}</span>
            <span className="text-purple-300">›</span>
          </button>
        </div>

        {/* Banner 2: ব্রাউজার লুডো কনসোল */}
        <Link
          href="/play"
          className="p-3.5 rounded-2xl bg-[#171038] text-white border border-purple-500/20 shadow-[0_4px_16px_rgba(10,5,30,0.5)] flex items-center justify-between gap-3 hover:border-purple-400/40 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image
                src="/dice_3d.png"
                alt="Dice"
                fill
                className="object-contain drop-shadow"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {lang === "en" ? "Browser Ludo Console" : "ব্রাউজার লুডো কনসোল"}
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NEW
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 mt-0.5 leading-snug">
                {lang === "en"
                  ? "Play directly inside your browser or practice with robots"
                  : "কোন অ্যাপ ছাড়াই সরাসরি ব্রাউজারে খেলুন বা রোবটের সাথে প্র্যাকটিস করুন"}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#22164f] text-purple-300 font-black text-xs flex-shrink-0 flex items-center gap-1 group-hover:bg-purple-900/40 border border-purple-500/30 transition-colors">
            <span>{lang === "en" ? "Play" : "খেলুন"}</span>
            <span>➔</span>
          </div>
        </Link>

        {/* Live Active Matches Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Ludo Matches
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="bg-[#10B981] text-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-md tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.4)] uppercase">
                LIVE
              </span>
              <Link
                href="/matches"
                className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-0.5 ml-1"
              >
                <span>{lang === "en" ? "All" : "সব"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-[#171038] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center bg-[#171038] rounded-2xl border border-purple-500/20 text-slate-300">
              <Swords className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
              <p className="text-xs font-semibold text-slate-300">
                {lang === "en" ? "No open matches currently available." : "বর্তমানে কোনো উন্মুক্ত ম্যাচ নেই।"}
              </p>
              <button
                onClick={() => setCreateMatchOpen(true)}
                className="mt-3 text-xs font-bold text-amber-400 hover:underline"
              >
                {lang === "en" ? "Create the first match yourself!" : "প্রথম ম্যাচটি আপনি তৈরি করুন!"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 5).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={user?.id}
                  onJoin={handleJoin}
                  joining={joiningId === match.id}
                  tutorialVideoUrl={matchesVideoUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => {
          refreshUser();
          fetchMatches();
        }}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        winBalance={user?.winBalance || 0}
        onSuccess={() => {
          refreshUser();
          fetchMatches();
        }}
      />

      <CreateMatchModal
        isOpen={createMatchOpen}
        onClose={() => setCreateMatchOpen(false)}
        userBalance={totalBalance}
        onSuccess={() => {
          refreshUser();
          fetchMatches();
        }}
      />

      {/* Login / Announcement Notice Modal */}
      <NoticeModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        autoShowOnLogin={user?.role !== "ADMIN"}
        isAdmin={user?.role === "ADMIN"}
      />
    </AppShell>
  );
}
