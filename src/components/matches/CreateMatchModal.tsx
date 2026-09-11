"use client";

import React, { useState } from "react";
import { X, PlusCircle, Trophy, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { fee: 20, prize: 36 },
    { fee: 50, prize: 90 },
    { fee: 100, prize: 180 },
    { fee: 200, prize: 360 },
    { fee: 500, prize: 900 },
  ];

  const currentFee = Number(entryFee) || 50;
  const estimatedPrize = Math.round(currentFee * 2 * 0.9);

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
        body: JSON.stringify({ entryFee: currentFee, matchType }),
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
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">নতুন লুডো ম্যাচ তৈরি করুন</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          {/* Match Type */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              গেম মোড
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "1v1 Classic", label: "১ বনাম ১ ক্লাসিক" },
                { id: "Quick Ludo", label: "কুইক লুডো (দ্রুত)" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMatchType(m.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    matchType === m.id
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20"
                      : "bg-slate-800/70 border-slate-700 text-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Fees */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              এন্ট্রি ফি নির্বাচন করুন
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.fee}
                  type="button"
                  onClick={() => setEntryFee(String(p.fee))}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    currentFee === p.fee
                      ? "bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-xs font-mono font-bold block text-cyan-400">
                    ৳{p.fee}
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-medium">
                    জিতলে ৳{p.prize}
                  </span>
                </button>
              ))}
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 font-mono"
              required
            />
          </div>

          {/* Prize preview card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[11px] text-slate-400 block">সম্ভাব্য বিজয়ী পুরস্কার</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  ৳ {estimatedPrize}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded">
              ১০% কমিশন বাদ
            </span>
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
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? "তৈরি হচ্ছে..." : `৳${currentFee} কেটে ম্যাচ তৈরি করুন`}
          </button>
        </form>
      </div>
    </div>
  );
}
