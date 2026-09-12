"use client";

import React, { useState } from "react";
import { X, PlusCircle, Trophy, AlertCircle, Users, KeyRound, Sparkles } from "lucide-react";
import { useToast } from "../common/ToastContext";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onSuccess: () => void;
}

export default function CreateMatchModal({
  isOpen,
  onClose,
  userBalance,
  onSuccess,
}: CreateMatchModalProps) {
  const { showToast } = useToast();
  const [entryFee, setEntryFee] = useState("50");
  const [matchType, setMatchType] = useState("1v1 Classic");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentFee = Number(entryFee) || 50;
  // 1v1 Match: 2 players, 10% platform commission
  const totalPot = currentFee * 2;
  const estimatedPrize = Math.round(totalPot * 0.9);

  const presets = [
    { fee: 20 },
    { fee: 50 },
    { fee: 100 },
    { fee: 200 },
    { fee: 500 },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentFee < 10) {
      showToast("সর্বনিম্ন ফি ১০ টাকা", "error");
      return;
    }

    if (userBalance < currentFee) {
      showToast(`আপনার ব্যালেন্স অপর্যাপ্ত (বর্তমান: ৳${userBalance})। ডিপোজিট করুন।`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryFee: currentFee,
          matchType: "1v1 Classic",
          maxPlayers: 2,
          roomCode: roomCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ম্যাচ তৈরি ব্যর্থ হয়েছে");
      }

      showToast(data.message || "ম্যাচ সফলভাবে তৈরি হয়েছে!", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">নতুন ১ বনাম ১ ম্যাচ তৈরি করুন</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          {/* Mode Indicator: 1v1 Match */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xs shadow-inner">
                1v1
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>১ বনাম ১ মোড (1v1)</span>
                  <span className="text-[10px] text-amber-400 font-normal bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Ludo King</span>
                </h3>
                <p className="text-[11px] text-slate-400">আপনি বনাম ১ জন প্রতিপক্ষ (মোট ২ জন)</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Classic
            </span>
          </div>

          {/* Preset Fees */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              এন্ট্রি ফি নির্বাচন করুন (জনপ্রতি)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {presets.map((p) => {
                const prize = Math.round(p.fee * 2 * 0.9);
                return (
                  <button
                    key={p.fee}
                    type="button"
                    onClick={() => setEntryFee(String(p.fee))}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      currentFee === p.fee
                        ? "bg-amber-500/20 border-amber-400 text-white shadow-sm shadow-amber-500/20"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold block text-amber-400">
                      ৳{p.fee}
                    </span>
                    <span className="text-[9px] text-emerald-400 block font-medium mt-0.5">
                      উইন ৳{prize}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Fee Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              কাস্টম এন্ট্রি ফি (৳)
            </label>
            <input
              type="number"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              placeholder="ফি লিখুন"
              min={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 font-mono"
              required
            />
          </div>

          {/* Optional Host Room Code Input upfront */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ludo King রুম কোড (ঐচ্ছিক - এখনই দিতে পারেন)</span>
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\s+/g, ""))}
              placeholder="Ludo King-এর ৮ ডিজিট কোড (যেমন: 04821943)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 font-mono tracking-wider placeholder:text-slate-600"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              টিপস: রুম কোড এখনই না দিলেও সমস্যা নেই, ম্যাচ তৈরি হওয়ার পরেও দিতে পারবেন।
            </span>
          </div>

          {/* Prize preview card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Trophy className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  বিজয়ী পুরস্কার (১ বনাম ১)
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ৳ {estimatedPrize}
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <span className="block font-mono">মোট পট: ৳{totalPot}</span>
              <span className="text-[10px] text-amber-400 font-semibold">১০% কমিশন বাদ</span>
            </div>
          </div>

          {userBalance < currentFee && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>আপনার ব্যালেন্স অপর্যাপ্ত। বর্তমান ব্যালেন্স: ৳{userBalance}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || userBalance < currentFee}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "তৈরি হচ্ছে..." : `৳${currentFee} দিয়ে ম্যাচ তৈরি করুন`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
