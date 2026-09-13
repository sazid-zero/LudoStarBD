"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { LeaderboardEntry } from "@/lib/types";
import { Trophy, ChevronLeft } from "lucide-react";
import Link from "next/link";

// Crown icon for podium winners
function CrownIcon({ color = "#F59E0B", className = "w-6 h-6" }: { color?: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color}>
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.myRank || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <AppShell title="Leaderboard" showBack>
      <div className="min-h-screen bg-[#0e0826] pb-24 text-white">
        {loading ? (
          <div className="p-4 space-y-4">
            <div className="h-64 bg-[#171038] rounded-3xl animate-pulse" />
            <div className="h-16 bg-[#171038] rounded-2xl animate-pulse" />
            <div className="h-32 bg-[#171038] rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="px-3.5 pt-4 space-y-4">
            {/* 3D Olympic Podium Section */}
            <div className="pt-2 pb-0 flex items-end justify-center gap-2 max-w-sm mx-auto">
              {/* #2 Left Podium Step */}
              <div className="flex-1 flex flex-col items-center">
                {second ? (
                  <>
                    <CrownIcon color="#C084FC" className="w-5 h-5 mb-1 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                    <div className="relative mb-1.5">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#201547] border-2 border-purple-400 shadow-[0_0_16px_rgba(192,132,252,0.5)] flex items-center justify-center text-purple-200 font-black text-lg">
                        {second.name.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[85px] text-center block">
                      {second.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 mt-1 rounded-full bg-[#1b1240] border border-amber-500/40 text-[11px] font-mono font-black text-amber-300 shadow-sm">
                      ৳ {second.totalEarnings.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <div className="h-20" />
                )}

                {/* Podium Block 2 */}
                <div className="w-full h-24 mt-2.5 rounded-t-2xl bg-gradient-to-b from-[#22174d] via-[#1a113d] to-[#120b2e] border-t-2 border-purple-400/80 shadow-[0_0_16px_rgba(168,85,247,0.2)] flex items-center justify-center">
                  <span className="text-3xl font-black text-purple-400/50 select-none">2</span>
                </div>
              </div>

              {/* #1 Center Podium Step (Elevated) */}
              <div className="flex-1 flex flex-col items-center -translate-y-2">
                {first ? (
                  <>
                    <CrownIcon color="#F59E0B" className="w-7 h-7 mb-1 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-bounce" />
                    <div className="relative mb-1.5">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#2a1b59] border-2 border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.6)] flex items-center justify-center text-amber-300 font-black text-2xl">
                        {first.name.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-sm font-black text-white truncate max-w-[95px] text-center block">
                      {first.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 mt-1 rounded-full bg-[#1b1240] border border-amber-400 text-xs font-mono font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      ৳ {first.totalEarnings.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <div className="h-24" />
                )}

                {/* Podium Block 1 */}
                <div className="w-full h-32 mt-2.5 rounded-t-2xl bg-gradient-to-b from-[#2d1b66] via-[#1d1245] to-[#120b2e] border-t-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center">
                  <span className="text-4xl font-black text-amber-400/60 select-none">1</span>
                </div>
              </div>

              {/* #3 Right Podium Step */}
              <div className="flex-1 flex flex-col items-center">
                {third ? (
                  <>
                    <CrownIcon color="#FB923C" className="w-5 h-5 mb-1 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                    <div className="relative mb-1.5">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#201547] border-2 border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.5)] flex items-center justify-center text-orange-200 font-black text-lg">
                        {third.name.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[85px] text-center block">
                      {third.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 mt-1 rounded-full bg-[#1b1240] border border-amber-500/40 text-[11px] font-mono font-black text-amber-300 shadow-sm">
                      ৳ {third.totalEarnings.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <div className="h-20" />
                )}

                {/* Podium Block 3 */}
                <div className="w-full h-20 mt-2.5 rounded-t-2xl bg-gradient-to-b from-[#22174d] via-[#1a113d] to-[#120b2e] border-t-2 border-orange-400/80 shadow-[0_0_16px_rgba(251,146,60,0.2)] flex items-center justify-center">
                  <span className="text-3xl font-black text-orange-400/50 select-none">3</span>
                </div>
              </div>
            </div>

            {/* Current User Sticky / Highlighted Bar */}
            {myRank && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#231554] to-[#1b1142] border border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-black font-mono text-purple-300 w-6 text-center">
                    {myRank.rank < 10 ? `0${myRank.rank}` : myRank.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/60 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow">
                    {myRank.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white text-xs truncate">
                        {myRank.name}
                      </span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                        (You)
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-300/80 font-mono block truncate">
                      {myRank.phonePartial || `@user_${myRank.userId.slice(0, 8)}`}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-2">
                  <span className="text-sm font-black font-mono text-amber-300 block">
                    ৳ {myRank.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {myRank.matchesWon} জয়
                  </span>
                </div>
              </div>
            )}

            {/* Remaining Players List */}
            {rest.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-300/80">
                    অন্যান্য শীর্ষ খেলোয়াড়বৃন্দ
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {leaderboard.length} জন প্লেয়ার
                  </span>
                </div>

                <div className="space-y-2">
                  {rest.map((entry) => (
                    <div
                      key={entry.userId}
                      className="p-3 rounded-2xl bg-[#171038] border border-purple-500/20 hover:border-purple-400/40 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold font-mono text-slate-400 w-6 text-center">
                          {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-[#22164f] border border-purple-500/30 flex items-center justify-center text-purple-200 font-black text-xs flex-shrink-0">
                          {entry.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block truncate">
                            {entry.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {entry.phonePartial}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="font-mono font-black text-amber-300 block text-xs">
                          ৳ {entry.totalEarnings.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {entry.matchesWon} জয়
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
