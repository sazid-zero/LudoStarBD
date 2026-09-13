"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { LeaderboardEntry } from "@/lib/types";
import { Trophy, Medal, Award, Flame, User as UserIcon } from "lucide-react";

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
    <AppShell title="সেরা খেলোয়াড় লিডারবোর্ড">
      <div className="p-3.5 space-y-4">
        {/* Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-emerald-500/10 border border-amber-500/25 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">সর্বোচ্চ বিজয়ী র‍্যাংকিং</h3>
            <p className="text-[11px] text-slate-300">
              বেশি বেশি ম্যাচ জিতে লিডারবোর্ডের শীর্ষে উঠুন এবং বিশেষ বোনাস অর্জন করুন।
            </p>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {loading ? (
          <div className="h-44 bg-slate-900/60 rounded-2xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-3 gap-2 items-end pt-6 pb-2 px-1">
            {/* 2nd Place */}
            {second && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-750 text-center flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-white font-black text-xs">
                    {second.name.slice(0, 1)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-md">
                    ২
                  </span>
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full block">
                  {second.name}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-0.5">
                  🪙{second.totalEarnings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {second.matchesWon} জয়
                </span>
              </div>
            )}

            {/* 1st Place (Elevated & Gold) */}
            {first && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500 text-center flex flex-col items-center shadow-xl shadow-amber-500/10 -translate-y-2">
                <Medal className="w-5 h-5 text-amber-400 mb-1" />
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-base shadow-lg">
                    {first.name.slice(0, 1)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    ১
                  </span>
                </div>
                <span className="text-xs font-extrabold text-white truncate max-w-full block">
                  {first.name}
                </span>
                <span className="text-xs font-mono font-extrabold text-amber-400 block mt-0.5">
                  🪙{first.totalEarnings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-300 block font-medium">
                  {first.matchesWon} জয় • {first.winRate}% উইন
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-750 text-center flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-amber-800 flex items-center justify-center text-white font-black text-xs">
                    {third.name.slice(0, 1)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center shadow-md">
                    ৩
                  </span>
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full block">
                  {third.name}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-0.5">
                  🪙{third.totalEarnings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {third.matchesWon} জয়
                </span>
              </div>
            )}
          </div>
        )}

        {/* My Rank Card */}
        {myRank && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                #{myRank.rank}
              </span>
              <div>
                <span className="font-bold text-white block">আপনার বর্তমান র‍্যাঙ্ক</span>
                <span className="text-[11px] text-slate-300">
                  মোট উইনিং: ৳{myRank.totalEarnings.toLocaleString()} ({myRank.matchesWon} জয়)
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full border border-amber-500/40">
              আপনি
            </span>
          </div>
        )}

        {/* Rest of Players List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            শীর্ষ খেলোয়াড়বৃন্দ
          </h3>

          <div className="space-y-1.5">
            {rest.map((entry) => (
              <div
                key={entry.userId}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center font-mono font-bold text-slate-400 text-xs">
                    #{entry.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                    {entry.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {entry.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {entry.phonePartial}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-emerald-400 block text-xs">
                    🪙{entry.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {entry.matchesWon} ম্যাচ জয়ী
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
