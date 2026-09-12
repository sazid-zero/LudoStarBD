"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import MatchCard from "@/components/matches/MatchCard";
import CreateMatchModal from "@/components/matches/CreateMatchModal";
import { Match } from "@/lib/types";
import { getYoutubeEmbedUrl, getYoutubeWatchUrl } from "@/lib/youtube";
import { Swords, Plus, RefreshCw, Wifi, HelpCircle, Play, X, ExternalLink } from "lucide-react";

export default function MatchesPage() {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "WAITING" | "RUNNING" | "COMPLETED" | "MY">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [showVideoGuide, setShowVideoGuide] = useState(false);
  const [matchesVideoUrl, setMatchesVideoUrl] = useState("https://www.youtube.com/watch?v=Y7VWtTgX0Rc");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setPolling(true);
    try {
      let url = "/api/matches";
      if (activeTab === "MY") {
        url += "?myOnly=true";
      } else if (activeTab !== "ALL") {
        url += `?status=${activeTab}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
      else setPolling(false);
    }
  }, [activeTab]);

  // Initial fetch when tab changes and load video settings
  useEffect(() => {
    fetchMatches();
    fetch("/api/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d?.settings?.video_matches) {
          setMatchesVideoUrl(d.settings.video_matches);
        }
      })
      .catch((err) => console.error("Error fetching matches video:", err));
  }, [fetchMatches]);

  // Real-time polling every 4 seconds (silent background refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const handleJoin = async (matchId: string) => {
    if (!user) {
      showToast("ম্যাচে জয়েন করতে আগে লগইন করুন", "error");
      return;
    }

    setJoiningId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ম্যাচে জয়েন করতে সমস্যা হয়েছে");
      }

      showToast(data.message || "সফলভাবে ম্যাচে যুক্ত হয়েছেন!", "success");
      await refreshUser();
      await fetchMatches();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setJoiningId(null);
    }
  };

  const tabs = [
    { id: "ALL", label: "সব ম্যাচ" },
    { id: "WAITING", label: "অপেক্ষমাণ" },
    { id: "RUNNING", label: "চলমান" },
    { id: "MY", label: "আমার ম্যাচ" },
    { id: "COMPLETED", label: "সমাপ্ত" },
  ] as const;

  const totalBalance = (user?.mainBalance || 0) + (user?.winBalance || 0);

  return (
    <AppShell title="লুডো ম্যাচ এরিনা">
      <div className="p-3.5 space-y-3.5">
        {/* Header & Create Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Ludo Matches</h2>
            <span className="bg-[#00D06C] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-md tracking-wider shadow-[0_0_8px_rgba(0,208,108,0.4)] uppercase">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time indicator */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${polling ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
              {lastUpdated && (
                <span className="hidden sm:inline">
                  {lastUpdated.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>

            <button
              onClick={() => fetchMatches()}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-95"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setShowVideoGuide(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 font-bold text-xs shadow-sm active:scale-95 transition-all"
              title="ভিডিও দেখে শিখুন কিভাবে খেলবেন"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">কিভাবে খেলবেন?</span>
              <span className="xs:hidden">গাইড</span>
            </button>

            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ম্যাচ</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 mt-4">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="text-sm font-semibold">কোনো ম্যাচ পাওয়া যায়নি।</p>
            <p className="text-xs text-slate-500 mt-1">
              আপনি নিজেই একটি ম্যাচ তৈরি করতে পারেন এবং প্রতিপক্ষকে চ্যালেঞ্জ করতে পারেন!
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
            >
              ম্যাচ তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
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

      <CreateMatchModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        userBalance={totalBalance}
        onSuccess={() => {
          refreshUser();
          fetchMatches();
        }}
      />

      {/* How to Play Video Tutorial Modal */}
      {showVideoGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0a1228] border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl text-left space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  লুডো খেলার নিয়ম ও টিউটোরিয়াল
                </h3>
              </div>
              <button
                onClick={() => setShowVideoGuide(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Tutorial Video */}
            <div className="space-y-1.5">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(matchesVideoUrl)}
                  title="Ludo King এ কীভাবে খেলবেন - সম্পূর্ণ নিয়ম"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Play className="w-3 h-3 fill-cyan-400" />
                  <span>ভিডিও দেখে ১ মিনিটে শিখে নিন</span>
                </span>
                <a
                  href={getYoutubeWatchUrl(matchesVideoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>YouTube এ দেখুন</span>
                </a>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ১
                </span>
                <p>পছন্দের এন্ট্রি ফি দিয়ে ম্যাচে জয়েন করুন এবং এডমিনের রুম কোড দেওয়ার অপেক্ষা করুন।</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ২
                </span>
                <p>কোড পাওয়ার পর Ludo King অ্যাপে ঢুকে 'Play with Friends' &gt; 'Join' ট্যাবে কোড পেস্ট করে খেলুন।</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ৩
                </span>
                <p>খেলা শেষে বিজয়ী হলে উইনিং স্ক্রিনশট নিয়ে ওয়েবসাইট ম্যাচ রুমে সাবমিট করে পুরস্কার বুঝে নিন।</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVideoGuide(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
